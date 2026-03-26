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

  // 列出服务器上的所有容器（使用 Docker SDK）
  async listServerContainers(serverId: string) {
    const server = await this.findOne(serverId);
    
    if (server.status !== 'online') {
      throw new BadRequestException('Server is offline');
    }

    try {
      this.logger.log(`请求服务器 ${serverId} 的容器列表（使用 Docker SDK）`);
      
      // 创建连接到远程 Docker 的实例
      // 注意：需要在远程服务器上配置 Docker 监听 TCP 端口
      const docker = new Docker({
        host: server.host,
        port: 2375, // Docker 默认 TCP 端口
      });
      
      // 列出所有容器（包括停止的）
      const containers = await docker.listContainers({ all: true });
      
      // 格式化容器信息
      const formattedContainers = containers.map(container => ({
        id: container.Id,
        name: container.Names[0]?.replace(/^\//, ''), // 移除开头的 /
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

  private generateToken(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}
