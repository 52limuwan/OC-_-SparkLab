import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentGateway } from '../agent/agent.gateway';
import { AgentService } from '../agent/agent.service';
import * as Docker from 'dockerode';

@Injectable()
export class ServerService {
  private readonly logger = new Logger(ServerService.name);

  constructor(
    private prisma: PrismaService,
    private agentGateway: AgentGateway,
    private agentService: AgentService,
  ) {}

  async create(data: {
    name: string;
  }) {
    // 生成 Agent Token
    const agentToken = this.generateToken();

    // 创建服务器记录（资源配置将由 Agent 自动上报）
    const server = await this.prisma.server.create({
      data: {
        name: data.name,
        host: '', // Agent 模式不需要
        port: 0,
        username: '',
        authType: 'password',
        password: agentToken, // 存储 Agent Token
        status: 'offline', // 等待 Agent 连接
      },
    });

    return {
      ...server,
      agentToken, // 返回 token 给前端显示（仅此一次）
    };
  }

  async findAll() {
    return this.prisma.server.findMany({
      include: {
        _count: {
          select: { containers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        containers: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true },
            },
            lab: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async update(id: string, data: Partial<{
    name: string;
    maxContainers: number;
    cpuCores: number;
    totalMemory: number;
    status: string;
  }>) {
    return this.prisma.server.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const server = await this.findOne(id);

    // 检查是否有活跃容器
    const activeContainers = await this.prisma.container.count({
      where: {
        serverId: id,
        status: { in: ['creating', 'running'] },
      },
    });

    if (activeContainers > 0) {
      throw new BadRequestException(`Cannot delete server with ${activeContainers} active containers`);
    }

    await this.prisma.server.delete({ where: { id } });

    return { message: 'Server deleted successfully' };
  }

  // 选择负载最低的服务器
  async selectBestServer(): Promise<string> {
    const servers = await this.prisma.server.findMany({
      where: {
        status: 'online',
      },
    });

    if (servers.length === 0) {
      throw new BadRequestException('No available servers');
    }

    // 计算负载分数（容器数 / 最大容器数）
    const serverScores = servers.map(server => ({
      id: server.id,
      score: server.activeContainers / server.maxContainers,
    }));

    // 选择负载最低的
    serverScores.sort((a, b) => a.score - b.score);
    return serverScores[0].id;
  }

  // 通过 Agent 执行 Docker 操作
  async executeDockerCommand(serverId: string, command: string, data: any): Promise<any> {
    const agent = this.agentService.getAgentByServerId(serverId);
    if (!agent) {
      throw new BadRequestException('Server is offline');
    }

    return this.agentGateway.sendCommand(agent.socketId, command, data);
  }

  // 列出服务器上的所有容器
  async listServerContainers(serverId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`请求服务器 ${serverId} 的容器列表`);
      
      // 创建连接到远程 Docker 的实例
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      // 列出所有容器（包括停止的）
      const containers = await docker.listContainers({ all: true });
      
      // 格式化容器信息
      const formattedContainers = containers.map(container => ({
        id: container.Id,
        name: container.Names[0]?.replace(/^\//, ''),
        image: container.Image,
        status: container.State,
        created: new Date(container.Created * 1000).toISOString(),
        ports: container.Ports,
      }));
      
      this.logger.log(`找到 ${formattedContainers.length} 个容器`);
      
      return { containers: formattedContainers };
    } catch (error) {
      this.logger.error(`获取服务器 ${serverId} 容器列表失败: ${error.message}`);
      throw new BadRequestException(`Failed to list containers: ${error.message}`);
    }
  }

  // 列出服务器上的所有镜像
  async listServerImages(serverId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`请求服务器 ${serverId} 的镜像列表`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      // 列出所有镜像
      const images = await docker.listImages();
      
      // 格式化镜像信息
      const formattedImages = images.map(image => ({
        id: image.Id,
        tags: image.RepoTags || [],
        size: image.Size,
        created: new Date(image.Created * 1000).toISOString(),
      }));
      
      this.logger.log(`找到 ${formattedImages.length} 个镜像`);
      
      return { images: formattedImages };
    } catch (error) {
      this.logger.error(`获取服务器 ${serverId} 镜像列表失败: ${error.message}`);
      throw new BadRequestException(`Failed to list images: ${error.message}`);
    }
  }

  // 在远程服务器上创建容器
  async createContainerOnServer(
    serverId: string,
    options: any,
  ): Promise<{ id: string; portMappings: any[] }> {
    const server = await this.findOne(serverId);
    
    this.logger.log(`在服务器 ${serverId} 上创建容器: ${options.name}`);

    try {
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });

      await this.pullImageOnServer(docker, options.image);

      const containerConfig: any = {
        Image: options.image,
        name: options.name,
        Tty: true,
        OpenStdin: true,
        HostConfig: {
          Memory: options.memoryLimit * 1024 * 1024,
          NanoCpus: Math.floor(options.cpuLimit * 1000000000),
          AutoRemove: false,
          RestartPolicy: {
            Name: options.restartPolicy || 'unless-stopped',
          },
        },
        ExposedPorts: {},
      };

      const portBindings: any = {};
      const actualPortMappings: Array<{
        containerPort: number;
        hostPort: number;
        protocol: 'tcp' | 'udp';
      }> = [];

      if (options.portMappings && options.portMappings.length > 0) {
        for (const pm of options.portMappings) {
          const portKey = `${pm.containerPort}/${pm.protocol}`;
          containerConfig.ExposedPorts![portKey] = {};
          
          if (pm.random) {
            portBindings[portKey] = [{ HostPort: '' }];
          } else {
            portBindings[portKey] = [{ HostPort: String(pm.hostPort) }];
          }
        }
      }

      containerConfig.HostConfig!.PortBindings = portBindings;

      if (options.environmentVars && options.environmentVars.length > 0) {
        containerConfig.Env = options.environmentVars.map(
          (ev: any) => `${ev.name}=${ev.value}`
        );
      }

      if (options.volumeMounts && options.volumeMounts.length > 0) {
        containerConfig.HostConfig!.Binds = options.volumeMounts.map(
          (vm: any) => `${vm.hostPath}:${vm.containerPath}:${vm.mode}`
        );
      }

      const container = await docker.createContainer(containerConfig);
      await container.start();

      const inspect = await container.inspect();
      const ports = inspect.NetworkSettings.Ports;

      if (options.portMappings) {
        for (const pm of options.portMappings) {
          const portKey = `${pm.containerPort}/${pm.protocol}`;
          const hostPort = ports[portKey]?.[0]?.HostPort;
          if (hostPort) {
            actualPortMappings.push({
              containerPort: pm.containerPort,
              hostPort: parseInt(hostPort),
              protocol: pm.protocol,
            });
          }
        }
      }

      return {
        id: container.id,
        portMappings: actualPortMappings,
      };
    } catch (error) {
      this.logger.error(`在服务器 ${serverId} 上创建容器失败: ${error.message}`);
      throw error;
    }
  }

  // 在远程服务器上拉取镜像
  private async pullImageOnServer(docker: any, image: string) {
    try {
      this.logger.log(`拉取镜像: ${image}`);
      await docker.pull(image);
      this.logger.log(`镜像拉取完成: ${image}`);
    } catch (error) {
      this.logger.warn(`拉取镜像 ${image} 失败，尝试使用本地镜像: ${error.message}`);
    }
  }

  // 在远程服务器上启动容器
  async startContainerOnServer(serverId: string, containerId: string) {
    const server = await this.findOne(serverId);
    this.logger.log(`在服务器 ${serverId} 上启动容器: ${containerId}`);
    
    const docker = new Docker({
      host: server.host,
      port: 2375,
    });
    
    const container = docker.getContainer(containerId);
    await container.start();
  }

  // 在远程服务器上停止容器
  async stopContainerOnServer(serverId: string, containerId: string) {
    const server = await this.findOne(serverId);
    this.logger.log(`在服务器 ${serverId} 上停止容器: ${containerId}`);
    
    const docker = new Docker({
      host: server.host,
      port: 2375,
    });
    
    const container = docker.getContainer(containerId);
    await container.stop();
  }

  // 在远程服务器上删除容器
  async removeContainerOnServer(serverId: string, containerId: string) {
    const server = await this.findOne(serverId);
    this.logger.log(`在服务器 ${serverId} 上删除容器: ${containerId}`);
    
    const docker = new Docker({
      host: server.host,
      port: 2375,
    });
    
    const container = docker.getContainer(containerId);
    try {
      await container.stop();
    } catch (e) {
    }
    await container.remove({ force: true });
  }

  // 启动容器 (保留旧的Agent方法，但不再使用)
  async startContainer(serverId: string, containerId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`启动容器 ${containerId} 在服务器 ${serverId}`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      const container = docker.getContainer(containerId);
      await container.start();
      
      return { message: 'Container started successfully' };
    } catch (error) {
      this.logger.error(`启动容器失败: ${error.message}`);
      throw new BadRequestException(`Failed to start container: ${error.message}`);
    }
  }

  // 停止容器
  async stopContainer(serverId: string, containerId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`停止容器 ${containerId} 在服务器 ${serverId}`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      const container = docker.getContainer(containerId);
      await container.stop();
      
      return { message: 'Container stopped successfully' };
    } catch (error) {
      this.logger.error(`停止容器失败: ${error.message}`);
      throw new BadRequestException(`Failed to stop container: ${error.message}`);
    }
  }

  // 删除容器
  async removeContainer(serverId: string, containerId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`删除容器 ${containerId} 在服务器 ${serverId}`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      const container = docker.getContainer(containerId);
      await container.remove({ force: true }); // force: true 可以删除运行中的容器
      
      return { message: 'Container removed successfully' };
    } catch (error) {
      this.logger.error(`删除容器失败: ${error.message}`);
      throw new BadRequestException(`Failed to remove container: ${error.message}`);
    }
  }

  // 删除镜像
  async removeImage(serverId: string, imageId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`删除镜像 ${imageId} 在服务器 ${serverId}`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      const image = docker.getImage(imageId);
      await image.remove({ force: true });
      
      return { message: 'Image removed successfully' };
    } catch (error) {
      this.logger.error(`删除镜像失败: ${error.message}`);
      throw new BadRequestException(`Failed to remove image: ${error.message}`);
    }
  }

  // 拉取镜像
  async pullImage(serverId: string, imageName: string, tag: string = 'latest') {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`拉取镜像 ${imageName}:${tag} 到服务器 ${serverId}`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      const fullImageName = `${imageName}:${tag}`;
      
      // 拉取镜像并收集日志
      const logs: string[] = [];
      
      await new Promise((resolve, reject) => {
        docker.pull(fullImageName, (err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          // 监听流数据
          stream.on('data', (chunk: Buffer) => {
            try {
              const data = JSON.parse(chunk.toString());
              if (data.status) {
                const logLine = data.id 
                  ? `${data.status}: ${data.id} ${data.progress || ''}`
                  : data.status;
                logs.push(logLine);
                this.logger.debug(logLine);
              }
            } catch (e) {
              // 忽略解析错误
            }
          });
          
          docker.modem.followProgress(stream, (err: any, output: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(output);
            }
          });
        });
      });
      
      return { 
        message: 'Image pulled successfully', 
        image: fullImageName,
        logs: logs.slice(-20), // 返回最后20条日志
      };
    } catch (error) {
      this.logger.error(`拉取镜像失败: ${error.message}`);
      throw new BadRequestException(`Failed to pull image: ${error.message}`);
    }
  }

  // 构建镜像
  async buildImage(serverId: string, dockerfile: string, imageName: string, tag: string = 'latest') {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`构建镜像 ${imageName}:${tag} 在服务器 ${serverId}`);
      
      const docker = new Docker({
        host: server.host,
        port: 2375,
      });
      
      const fullImageName = `${imageName}:${tag}`;
      
      // 创建 tar 包含 Dockerfile
      const tarStream = require('tar-stream');
      const pack = tarStream.pack();
      pack.entry({ name: 'Dockerfile' }, dockerfile);
      pack.finalize();
      
      // 构建镜像并收集日志
      const logs: string[] = [];
      
      await new Promise((resolve, reject) => {
        docker.buildImage(pack, { t: fullImageName }, (err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          // 监听流数据
          stream.on('data', (chunk: Buffer) => {
            try {
              const data = JSON.parse(chunk.toString());
              if (data.stream) {
                const logLine = data.stream.trim();
                if (logLine) {
                  logs.push(logLine);
                  this.logger.debug(logLine);
                }
              } else if (data.status) {
                logs.push(data.status);
                this.logger.debug(data.status);
              }
            } catch (e) {
              // 忽略解析错误
            }
          });
          
          docker.modem.followProgress(stream, (err: any, output: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(output);
            }
          });
        });
      });
      
      return { 
        message: 'Image built successfully', 
        image: fullImageName,
        logs: logs.slice(-30), // 返回最后30条日志
      };
    } catch (error) {
      this.logger.error(`构建镜像失败: ${error.message}`);
      throw new BadRequestException(`Failed to build image: ${error.message}`);
    }
  }

  // 获取服务器上已使用的端口
  async getUsedPorts(serverId: string): Promise<number[]> {
    const containers = await this.prisma.container.findMany({
      where: {
        serverId,
        status: { in: ['creating', 'running', 'stopped'] },
      },
      select: { portMappings: true },
    });

    const usedPorts: number[] = [];
    for (const container of containers) {
      if (container.portMappings) {
        try {
          const mappings = JSON.parse(container.portMappings);
          for (const mapping of mappings) {
            if (mapping.hostPort) {
              usedPorts.push(mapping.hostPort);
            }
          }
        } catch (e) {
          console.error('Failed to parse port mappings:', e);
        }
      }
    }

    return [...new Set(usedPorts)];
  }

  // 获取随机可用端口
  async getRandomAvailablePort(serverId: string, portRange: { min: number; max: number } = { min: 10000, max: 50000 }): Promise<number> {
    const usedPorts = await this.getUsedPorts(serverId);
    const availablePorts: number[] = [];

    for (let port = portRange.min; port <= portRange.max; port++) {
      if (!usedPorts.includes(port)) {
        availablePorts.push(port);
      }
    }

    if (availablePorts.length === 0) {
      throw new BadRequestException('No available ports in range');
    }

    const randomIndex = Math.floor(Math.random() * availablePorts.length);
    return availablePorts[randomIndex];
  }

  private generateToken(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}
