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

    const [lab, user] = await Promise.all([
      this.prisma.lab.findUnique({ where: { id: labId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!serverId) {
      serverId = lab.serverId || await this.serverService.selectBestServer();
    }

    const tempContainerId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const container = await this.prisma.container.create({
      data: {
        userId,
        labId,
        serverId,
        containerId: tempContainerId,
        status: 'creating',
        cpuLimit: lab.cpuLimit,
        memoryLimit: lab.memoryLimit,
      },
    });

    try {
      const portMappings = lab.portMappings ? JSON.parse(lab.portMappings) : [];
      const environmentVars = lab.environmentVars ? JSON.parse(lab.environmentVars) : [];
      const volumeMounts = lab.volumeMounts ? JSON.parse(lab.volumeMounts) : [];

      const randomSuffix = Math.random().toString(36).substr(2, 6);
      const safeUsername = user.username.replace(/[^a-zA-Z0-9_-]/g, '-');
      const containerName = `${safeUsername}-${labId.slice(0, 8)}-${randomSuffix}`;

      const containerOptions = {
        image: lab.dockerImage,
        name: containerName,
        cpuLimit: lab.cpuLimit,
        memoryLimit: lab.memoryLimit,
        portMappings,
        environmentVars,
        volumeMounts,
        restartPolicy: lab.restartPolicy as any,
      };

      let dockerContainer;

      if (serverId) {
        dockerContainer = await this.serverService.executeDockerCommand(
          serverId,
          'docker:create',
          containerOptions,
        );
      } else {
        dockerContainer = await this.dockerService.createContainer(containerOptions);
      }

      const updated = await this.prisma.container.update({
        where: { id: container.id },
        data: {
          containerId: dockerContainer.id,
          status: 'running',
          startedAt: new Date(),
          portMappings: JSON.stringify(dockerContainer.portMappings || []),
          autoStopAt: new Date(Date.now() + parseInt(process.env.AUTO_STOP_TIMEOUT || '1800000')),
        },
      });

      return updated;
    } catch (error) {
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
            shellCommand: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole?: string) {
    const container = await this.prisma.container.findUnique({
      where: { id },
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

    return container;
  }

  async start(id: string, userId: string, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

    if (container.status === 'running') {
      return container;
    }

    const lab = await this.prisma.lab.findUnique({
      where: { id: container.labId },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    let dockerContainer;

    if (!container.containerId || container.containerId === '') {
      const portMappings = lab.portMappings ? JSON.parse(lab.portMappings) : [];
      const environmentVars = lab.environmentVars ? JSON.parse(lab.environmentVars) : [];
      const volumeMounts = lab.volumeMounts ? JSON.parse(lab.volumeMounts) : [];

      const containerOptions = {
        image: lab.dockerImage,
        name: `lab-${container.id}`,
        cpuLimit: lab.cpuLimit,
        memoryLimit: lab.memoryLimit,
        portMappings,
        environmentVars,
        volumeMounts,
        restartPolicy: lab.restartPolicy as any,
      };

      if (container.serverId) {
        dockerContainer = await this.serverService.executeDockerCommand(
          container.serverId,
          'docker:create',
          containerOptions,
        );
      } else {
        dockerContainer = await this.dockerService.createContainer(containerOptions);
      }
    } else {
      if (container.serverId) {
        await this.serverService.executeDockerCommand(
          container.serverId,
          'docker:start',
          { containerId: container.containerId },
        );
      } else {
        await this.dockerService.startContainer(container.containerId);
      }
    }

    return this.prisma.container.update({
      where: { id },
      data: {
        containerId: dockerContainer?.id || container.containerId,
        status: 'running',
        startedAt: new Date(),
        lastActiveAt: new Date(),
        portMappings: dockerContainer?.portMappings ? JSON.stringify(dockerContainer.portMappings) : container.portMappings,
        autoStopAt: new Date(Date.now() + parseInt(process.env.AUTO_STOP_TIMEOUT || '1800000')),
      },
    });
  }

  async stop(id: string, userId: string, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

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

  async remove(id: string, userId: string, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

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
    }

    await this.prisma.container.delete({
      where: { id },
    });

    return { message: 'Container removed successfully' };
  }

  async updateHeartbeat(id: string, userId: string, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

    return this.prisma.container.update({
      where: { id },
      data: {
        lastActiveAt: new Date(),
        autoStopAt: new Date(Date.now() + parseInt(process.env.AUTO_STOP_TIMEOUT || '1800000')),
      },
    });
  }

  async execCommand(id: string, userId: string, command: string, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

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

  async execCreate(id: string, userId: string, command: string, options?: any, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

    if (container.status !== 'running') {
      throw new BadRequestException('Container is not running');
    }

    if (container.serverId) {
      const result = await this.serverService.executeDockerCommand(
        container.serverId,
        'docker:exec_create',
        {
          containerId: container.containerId,
          command,
          tty: options?.tty ?? true,
          stdin: options?.stdin ?? true,
          stdout: options?.stdout ?? true,
          stderr: options?.stderr ?? true,
        },
      );
      return { execId: result.data.execId };
    } else {
      const result = await this.dockerService.execCreate(container.containerId, command, options);
      return result;
    }
  }

  async execStart(id: string, userId: string, execId: string, options?: any, userRole?: string) {
    const container = await this.findOne(id, userId, userRole);

    if (container.status !== 'running') {
      throw new BadRequestException('Container is not running');
    }

    if (container.serverId) {
      const result = await this.serverService.executeDockerCommand(
        container.serverId,
        'docker:exec_start',
        {
          execId,
          stream: options?.stream ?? false,
          detach: options?.detach ?? false,
          tty: options?.tty ?? true,
        },
      );
      if (result.data.streaming) {
        return { streaming: true };
      }
      return { output: result.data.output };
    } else {
      const result = await this.dockerService.execStart(container.containerId, execId, options);
      return result;
    }
  }
}
