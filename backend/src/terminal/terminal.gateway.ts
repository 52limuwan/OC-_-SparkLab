import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as os from 'os';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/terminal',
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private sessions = new Map<string, any>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const session = this.sessions.get(client.id);
    if (session?.shell) {
      session.shell.kill();
    }
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('start')
  async handleStart(client: Socket, data: { containerId: string }) {
    try {
      this.logger.log(`Starting terminal session for container: ${data.containerId}`);
      
      // 根据操作系统选择 shell
      const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';
      
      // 启动本地 shell
      const shellProcess = spawn(shell, [], {
        cwd: process.cwd(),
        env: process.env,
      });

      this.sessions.set(client.id, { shell: shellProcess });

      shellProcess.stdout.on('data', (data: Buffer) => {
        client.emit('output', data.toString('utf-8'));
      });

      shellProcess.stderr.on('data', (data: Buffer) => {
        client.emit('output', data.toString('utf-8'));
      });

      shellProcess.on('exit', (code) => {
        client.emit('exit', { code });
        this.sessions.delete(client.id);
      });

      client.emit('ready');
      
      // 发送欢迎消息
      const welcomeMsg = os.platform() === 'win32' 
        ? 'Windows PowerShell\r\nCopyright (C) Microsoft Corporation. All rights reserved.\r\n\r\n'
        : 'Welcome to Docker Lab Terminal (Local Mode)\r\n';
      client.emit('output', welcomeMsg);
      
      this.logger.log(`Terminal session started for client: ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to start terminal: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('input')
  handleInput(client: Socket, data: string) {
    const session = this.sessions.get(client.id);
    if (session?.shell) {
      session.shell.stdin.write(data);
    }
  }

  @SubscribeMessage('resize')
  async handleResize(client: Socket, data: { rows: number; cols: number }) {
    // 在本地模式下，resize 功能有限
    this.logger.log(`Terminal resize requested: ${data.rows}x${data.cols}`);
  }
}
