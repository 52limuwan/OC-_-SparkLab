import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from './docker.service';
import { ServerService } from '../server/server.service';

@Injectable()
export class ContainerService {
  constructor(
    private prisma: PrismaService,
    private dockerService: DockerService,
    private serverService: ServerService,
  ) {}

  async create(userId: string, labId: string, serverId?: string) {
    // 检查用户容器数量限制
    const userContainers = await this.prisma.container.count({
      where: {
        userId,
        status: { in: ['creating', 'running'] },
      },
    });

    const maxContainers = parseInt(process.env.MAX_CONTAINERS_PER_USER || '3');
    if (userContainers >= maxContainers) {
      throw new BadRequestException(`Maximum ${maxContainers} containers allowed per user`);
    }

    // 获取实验配置
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    // 选择服务器（如果未指定，自动选择负载最低的）
    if (!serverId) {
      serverId = await this.serverService.selectBestServer();
    }

    // 创建容器记录
    const container = await this.prisma.container.create({
      data: {
        userId,
        labId,
        serverId,
        containerId: '', // 临时占位
        status: 'creating',
        cpuLimit: lab.cpuLimit,
        memoryLimit: lab.memoryLimit,
      },
    });

    try {
      // 在远程服务器上创建 Docker 容器
      const dockerContainer = await this.serverService.executeDockerCommand(
        serverId,
        'docker:create',
        {
          image: lab.dockerImage,
          name: `spark-lab-${container.id}`,
          cpuLimit: lab.cpuLimit,
          memoryLimit: lab.memoryLimit,
        },
      );

      // 更新容器信息
      const updated = await this.prisma.container.update({
        where: { id: container.id },
        data: {
          containerId: dockerContainer.id,
          status: 'running',
          startedAt: new Date(),
          sshPort: dockerContainer.sshPort,
          vncPort: dockerContainer.vncPort,
          idePort: dockerContainer.idePort,
          autoStopAt: new Date(Date.now() + parseInt(process.env.AUTO_STOP_TIMEOUT || '1800000')),
        },
      });

      return updated;
    } catch (error) {
      // 创建失败，更新状态
      await this.prisma.container.update({
        where: { id: container.id },
        data: { status: 'error' },
      });
      throw error;
    }
  }

  async findByUser(userId: string) {
    return this.prisma.container.findMany({
      where: { userId },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            dockerImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const container = await this.prisma.container.findUnique({
      where: { id },
      include: {
        lab: true,
      },
    });

    if (!container) {
      throw new NotFoundException('Container not found');
    }

    if (container.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return container;
  }

  async start(id: string, userId: string) {
    const container = await this.findOne(id, userId);

    if (container.status === 'running') {
      return container;
    }

    if (container.serverId) {
      await this.serverService.executeDockerCommand(
        container.serverId,
        'docker:start',
        { containerId: container.containerId },
      );
    } else {
      await this.dockerService.startContainer(container.containerId);
    }

    return this.prisma.container.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: new Date(),
        lastActiveAt: new Date(),
        autoStopAt: new Date(Date.now() + parseInt(process.env.AUTO_STOP_TIMEOUT || '1800000')),
      },
    });
  }

  async stop(id: string, userId: string) {
    const container = await this.findOne(id, userId);

    if (container.serverId) {
      await this.serverService.executeDockerCommand(
        container.serverId,
        'docker:stop',
        { containerId: container.containerId },
      );
    } else {
      await this.dockerService.stopContainer(container.containerId);
    }

    return this.prisma.container.update({
      where: { id },
      data: {
        status: 'stopped',
        stoppedAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string) {
    const container = await this.findOne(id, userId);

    try {
      if (container.serverId) {
        await this.serverService.executeDockerCommand(
          container.serverId,
          'docker:remove',
          { containerId: container.containerId },
        );
      } else {
        await this.dockerService.removeContainer(container.containerId);
      }
    } catch (error) {
      // 容器可能已经不存在，继续删除记录
    }

    await this.prisma.container.delete({
      where: { id },
    });

    return { message: 'Container removed successfully' };
  }

  async updateHeartbeat(id: string, userId: string) {
    const container = await this.findOne(id, userId);

    return this.prisma.container.update({
      where: { id },
      data: {
        lastActiveAt: new Date(),
        autoStopAt: new Date(Date.now() + parseInt(process.env.AUTO_STOP_TIMEOUT || '1800000')),
      },
    });
  }

  async execCommand(id: string, userId: string, command: string) {
    const container = await this.findOne(id, userId);

    if (container.status !== 'running') {
      throw new BadRequestException('Container is not running');
    }

    if (container.serverId) {
      const result = await this.serverService.executeDockerCommand(
        container.serverId,
        'docker:exec',
        { containerId: container.containerId, command },
      );
      return { output: result.output };
    } else {
      const result = await this.dockerService.execCommand(container.containerId, command);
      return result;
    }
  }
}
