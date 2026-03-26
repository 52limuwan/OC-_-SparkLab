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

  constructor(private agentService: AgentService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const serverName = client.handshake.auth.serverName;

    this.logger.log(`Agent 尝试连接: ${serverName} (${client.id})`);

    try {
      // 验证 token 并注册 Agent
      await this.agentService.registerAgent(client.id, token, serverName);
      this.logger.log(`Agent 已连接: ${serverName}`);
    } catch (error) {
      this.logger.error(`Agent 连接失败: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Agent 断开连接: ${client.id}`);
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
        reject(new Error('Agent 响应超时'));
      }, 30000);

      this.server.to(agentId).emit(event, data, (response: any) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
}
