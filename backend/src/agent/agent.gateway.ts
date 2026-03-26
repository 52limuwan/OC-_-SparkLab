import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AgentService } from './agent.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/agent',
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgentGateway.name);
  private readonly sockets = new Map<string, Socket>(); // 存储 socket 引用

  constructor(private agentService: AgentService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const serverName = client.handshake.auth.serverName;
    
    // 获取客户端 IP
    const clientIp = client.handshake.address || 
                     client.handshake.headers['x-forwarded-for'] || 
                     client.conn.remoteAddress;
    
    // 清理 IPv6 前缀
    const cleanIp = clientIp?.toString().replace(/^::ffff:/, '') || 'unknown';

    this.logger.log(`Agent 尝试连接: ${serverName} (${client.id}) from ${cleanIp}`);

    try {
      // 验证 token 并注册 Agent，同时保存 IP
      await this.agentService.registerAgent(client.id, token, serverName, cleanIp);
      // 存储 socket 引用
      this.sockets.set(client.id, client);
      this.logger.log(`Agent 已连接: ${serverName}`);
    } catch (error) {
      this.logger.error(`Agent 连接失败: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Agent 断开连接: ${client.id}`);
    // 移除 socket 引用
    this.sockets.delete(client.id);
    await this.agentService.unregisterAgent(client.id);
  }

  @SubscribeMessage('agent:heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    await this.agentService.updateHeartbeat(client.id, data);
  }

  // 发送指令到 Agent
  async sendCommand(agentId: string, event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.logger.error(`Agent ${agentId} 响应超时 (事件: ${event})`);
        reject(new Error('Agent 响应超时'));
      }, 30000);

      // 从本地 Map 中获取 socket
      const socket = this.sockets.get(agentId);
      if (!socket) {
        clearTimeout(timeout);
        this.logger.error(`Agent socket not found: ${agentId}`);
        this.logger.error(`Available sockets: ${Array.from(this.sockets.keys()).join(', ')}`);
        reject(new Error('Agent socket not found'));
        return;
      }

      // 监听响应事件（使用 once 自动清理）
      socket.once(`${event}:response`, (response: any) => {
        clearTimeout(timeout);
        this.logger.log(`收到 Agent 响应: ${JSON.stringify(response)}`);
        
        if (!response) {
          this.logger.error(`Agent ${agentId} 未响应 (事件: ${event})`);
          reject(new Error('Agent 未响应'));
          return;
        }
        
        if (response.success) {
          resolve(response.data !== undefined ? response.data : response);
        } else {
          this.logger.error(`Agent 返回错误: ${response.error}`);
          reject(new Error(response.error || 'Unknown error'));
        }
      });

      this.logger.log(`发送事件 ${event} 到 Agent ${agentId}, 数据: ${JSON.stringify(data)}`);
      socket.emit(event, data);
    });
  }
}
