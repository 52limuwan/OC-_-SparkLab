import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from '../container/docker.service';
import { ServerService } from '../server/server.service';

@Injectable()
export class LabService {
  constructor(
    private prisma: PrismaService,
    private dockerService: DockerService,
    private serverService: ServerService,
  ) {}

  async findOne(id: string, userId?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        steps: {
          orderBy: { order: 'asc' },
        },
        submissions: userId ? {
          where: { userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        } : false,
      },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    return {
      ...lab,
      lastSubmission: userId && lab.submissions?.[0],
      submissions: undefined,
    };
  }

  async findByCourse(courseId: string) {
    return this.prisma.lab.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        steps: {
          select: {
            id: true,
            title: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  private async removeContainer(containerId: string, userId: string, userRole?: string) {
    const container = await this.prisma.container.findUnique({
      where: { id: containerId },
      include: {
        lab: true,
      },
    });

    if (!container) {
      throw new NotFoundException('Container not found');
    }

    if (userRole !== 'ADMIN' && container.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      if (container.serverId) {
        await this.serverService.removeContainerOnServer(
          container.serverId,
          container.containerId,
        );
      } else {
        await this.dockerService.removeContainer(container.containerId);
      }
    } catch (error) {
      console.error('Failed to remove docker container:', error);
    }

    await this.prisma.container.delete({
      where: { id: containerId },
    });

    return { message: 'Container removed successfully' };
  }

  async submit(labId: string, userId: string, code?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    // 创建提交记录
    const submission = await this.prisma.submission.create({
      data: {
        userId,
        labId,
        status: 'pending',
        maxScore: lab.points,
      },
    });

    // 查找并删除用户为此实验创建的容器
    const userContainers = await this.prisma.container.findMany({
      where: {
        userId,
        labId,
        status: { in: ['running', 'stopped'] },
      },
    });

    for (const container of userContainers) {
      try {
        await this.removeContainer(container.id, userId, 'STUDENT');
      } catch (error) {
        console.error(`Failed to remove container ${container.id}:`, error);
      }
    }

    // 如果有自动判题脚本，执行判题
    if (lab.judgeType === 'auto' && lab.judgeScript) {
      // TODO: 实现自动判题逻辑
      // 这里需要调用 Docker 服务执行判题脚本
    }

    return submission;
  }
}
