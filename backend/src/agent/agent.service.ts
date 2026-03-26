import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AgentConnection {
  socketId: string;
  serverId: string;
  serverName: string;
  connectedAt: Date;
  lastHeartbeat: Date;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private agents = new Map<string, AgentConnection>(); // socketId -> AgentConnection

  constructor(private prisma: PrismaService) {}

  async registerAgent(socketId: string, token: string, serverName: string, clientIp: string) {
    // 验证 token 并查找服务器
    const server = await this.prisma.server.findFirst({
      where: {
        name: serverName,
        password: token, // 使用 password 字段存储 token
      },
    });

    if (!server) {
      throw new UnauthorizedException('Invalid token or server name');
    }

    // 注册 Agent
    this.agents.set(socketId, {
      socketId,
      serverId: server.id,
      serverName,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    });

    // 更新服务器状态为在线，并保存 IP 地址
    await this.prisma.server.update({
      where: { id: server.id },
      data: {
        status: 'online',
        host: clientIp, // 保存 Agent 的 IP 地址
        lastCheckAt: new Date(),
      },
    });

    this.logger.log(`Agent 已注册: ${serverName} (${server.id}) IP: ${clientIp}`);
  }

  async unregisterAgent(socketId: string) {
    const agent = this.agents.get(socketId);
    if (!agent) return;

    // 更新服务器状态为离线
    await this.prisma.server.update({
      where: { id: agent.serverId },
      data: {
        status: 'offline',
      },
    });

    this.agents.delete(socketId);
    this.logger.log(`Agent 已注销: ${agent.serverName}`);
  }

  async updateHeartbeat(socketId: string, stats: any) {
    const agent = this.agents.get(socketId);
    if (!agent) return;

    agent.lastHeartbeat = new Date();

    // 构建更新数据，只更新提供的字段
    const updateData: any = {
      cpuUsage: stats.cpuUsage || 0,
      memoryUsage: stats.memoryUsage || 0,
      activeContainers: stats.activeContainers || 0,
      lastCheckAt: new Date(),
    };

    // 只在有值时更新硬件配置
    if (stats.cpuCores) {
      updateData.cpuCores = stats.cpuCores;
    }
    if (stats.totalMemory) {
      updateData.totalMemory = stats.totalMemory;
    }
    if (stats.cpuModel) {
      updateData.cpuModel = stats.cpuModel;
    }
    
    // 如果 Agent 上报了自己的 IP，保存它
    if (stats.serverIp) {
      updateData.host = stats.serverIp;
    }

    this.logger.debug(`更新心跳: ${agent.serverName}, CPU: ${stats.cpuUsage}%, 内存: ${stats.memoryUsage}%, 核心: ${stats.cpuCores}, 总内存: ${stats.totalMemory}MB`);

    // 更新服务器统计信息和硬件配置
    await this.prisma.server.update({
      where: { id: agent.serverId },
      data: updateData,
    });
  }

  getAgentByServerId(serverId: string): AgentConnection | undefined {
    for (const agent of this.agents.values()) {
      if (agent.serverId === serverId) {
        return agent;
      }
    }
    return undefined;
  }

  getAllAgents(): AgentConnection[] {
    return Array.from(this.agents.values());
  }

  isServerOnline(serverId: string): boolean {
    return this.getAgentByServerId(serverId) !== undefined;
  }
}
