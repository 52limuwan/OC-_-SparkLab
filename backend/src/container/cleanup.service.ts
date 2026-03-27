import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from './docker.service';
import { ServerService } from '../server/server.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private prisma: PrismaService,
    private dockerService: DockerService,
    private serverService: ServerService,
  ) {}

  // 每 5 分钟检查一次需要自动停止的容器
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoStop() {
    this.logger.log('Running auto-stop cleanup task');

    const now = new Date();
    const containersToStop = await this.prisma.container.findMany({
      where: {
        status: 'running',
        autoStopAt: {
          lte: now,
        },
      },
    });

    this.logger.log(`Found ${containersToStop.length} containers to auto-stop`);

    for (const container of containersToStop) {
      try {
        if (container.serverId) {
          await this.serverService.stopContainerOnServer(
            container.serverId,
            container.containerId,
          );
        } else {
          await this.dockerService.stopContainer(container.containerId);
        }
        
        await this.prisma.container.update({
          where: { id: container.id },
          data: {
            status: 'stopped',
            stoppedAt: new Date(),
          },
        });

        this.logger.log(`Auto-stopped container: ${container.id}`);
      } catch (error) {
        this.logger.error(`Failed to auto-stop container ${container.id}: ${error.message}`);
      }
    }
  }

  // 每天凌晨 2 点清理超过 7 天的已停止容器
  @Cron('0 2 * * *')
  async handleCleanupOldContainers() {
    this.logger.log('Running old containers cleanup task');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldContainers = await this.prisma.container.findMany({
      where: {
        status: 'stopped',
        stoppedAt: {
          lte: sevenDaysAgo,
        },
      },
    });

    this.logger.log(`Found ${oldContainers.length} old containers to cleanup`);

    for (const container of oldContainers) {
      try {
        if (container.serverId) {
          await this.serverService.removeContainerOnServer(
            container.serverId,
            container.containerId,
          );
        } else {
          await this.dockerService.removeContainer(container.containerId);
        }
        
        await this.prisma.container.delete({
          where: { id: container.id },
        });

        this.logger.log(`Cleaned up old container: ${container.id}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup container ${container.id}: ${error.message}`);
      }
    }
  }
}
