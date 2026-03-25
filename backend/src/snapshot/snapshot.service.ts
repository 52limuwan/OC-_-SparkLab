import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from '../container/docker.service';

@Injectable()
export class SnapshotService {
  constructor(
    private prisma: PrismaService,
    private dockerService: DockerService,
  ) {}

  async create(userId: string, containerId: string, name: string, description?: string) {
    // 验证容器所有权
    const container = await this.prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container not found');
    }

    if (container.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 创建 Docker 镜像快照
    const imageName = `spark-lab-snapshot-${Date.now()}`;
    const imageId = await this.dockerService.commitContainer(
      container.containerId,
      imageName,
    );

    // 保存快照记录
    const snapshot = await this.prisma.snapshot.create({
      data: {
        userId,
        containerId,
        imageId,
        name,
        description,
      },
    });

    return snapshot;
  }

  async findByUser(userId: string) {
    return this.prisma.snapshot.findMany({
      where: { userId },
      include: {
        container: {
          select: {
            id: true,
            lab: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id },
      include: {
        container: {
          include: {
            lab: true,
          },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    if (snapshot.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return snapshot;
  }

  async restore(id: string, userId: string) {
    const snapshot = await this.findOne(id, userId);

    // 从快照创建新容器
    const containerName = `spark-lab-restored-${Date.now()}`;
    const dockerContainerId = await this.dockerService.createFromSnapshot(
      snapshot.imageId,
      containerName,
    );

    // 创建容器记录
    const container = await this.prisma.container.create({
      data: {
        userId,
        labId: snapshot.container.labId,
        containerId: dockerContainerId,
        status: 'running',
        startedAt: new Date(),
        cpuLimit: snapshot.container.cpuLimit,
        memoryLimit: snapshot.container.memoryLimit,
      },
    });

    return container;
  }

  async remove(id: string, userId: string) {
    const snapshot = await this.findOne(id, userId);

    // 删除快照记录
    await this.prisma.snapshot.delete({
      where: { id },
    });

    // TODO: 删除 Docker 镜像（可选）
    // await this.dockerService.removeImage(snapshot.imageId);

    return { message: 'Snapshot removed successfully' };
  }
}
