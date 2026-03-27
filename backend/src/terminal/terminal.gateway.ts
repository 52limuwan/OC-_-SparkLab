import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServerService } from '../server/server.service';
import * as Docker from 'dockerode';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/terminal',
})
@Injectable()
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private sessions = new Map<string, any>();
  private localDocker: Docker;

  constructor(
    private prisma: PrismaService,
    private serverService: ServerService,
  ) {
    const dockerHost = process.env.DOCKER_HOST;
    if (dockerHost && dockerHost.startsWith('tcp://')) {
      const url = new URL(dockerHost);
      this.localDocker = new Docker({ host: url.hostname, port: parseInt(url.port) });
    } else {
      this.localDocker = new Docker({
        socketPath: dockerHost || '/var/run/docker.sock',
      });
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const session = this.sessions.get(client.id);
    if (session?.exec) {
      try {
        session.exec.destroy();
      } catch (e) {
      }
    }
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('start')
  async handleStart(client: Socket, data: { id: string }) {
    try {
      this.logger.log(`Starting terminal session for container ID: ${data.id}`);
      
      const containerRecord = await this.prisma.container.findUnique({
        where: { id: data.id },
        include: { server: true },
      });

      if (!containerRecord) {
        throw new Error('Container not found');
      }

      if (!containerRecord.containerId) {
        throw new Error('Container ID not available');
      }

      let docker: Docker;
      if (containerRecord.serverId) {
        const server = containerRecord.server;
        docker = new Docker({
          host: server.host,
          port: 2375,
        });
      } else {
        docker = this.localDocker;
      }

      const container = docker.getContainer(containerRecord.containerId);
      
      const inspect = await container.inspect();
      if (!inspect.State.Running) {
        throw new Error('Container is not running');
      }

      const lab = await this.prisma.lab.findUnique({
        where: { id: containerRecord.labId },
      });

      const shellCommand = lab?.shellCommand || '/bin/bash';

      const exec = await container.exec({
        Cmd: [shellCommand],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
      });

      const stream = await exec.start({
        hijack: true,
        stdin: true,
      });

      this.sessions.set(client.id, { exec, stream });

      stream.on('data', (chunk: Buffer) => {
        client.emit('output', chunk.toString('utf-8'));
      });

      stream.on('end', () => {
        client.emit('exit', { code: 0 });
        this.sessions.delete(client.id);
      });

      stream.on('error', (err) => {
        this.logger.error(`Terminal stream error: ${err.message}`);
        client.emit('error', { message: err.message });
      });

      client.emit('ready');

      client.emit('output', `Welcome to Spark Lab Container Terminal\r\n`);
      client.emit('output', `Container ID: ${containerRecord.containerId.slice(0, 12)}\r\n`);
      client.emit('output', `Type your commands below:\r\n\r\n`);

      this.logger.log(`Terminal session started for client: ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to start terminal: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('input')
  handleInput(client: Socket, data: string) {
    const session = this.sessions.get(client.id);
    if (session?.stream) {
      session.stream.write(data);
    }
  }

  @SubscribeMessage('resize')
  async handleResize(client: Socket, data: { rows: number; cols: number }) {
    const session = this.sessions.get(client.id);
    if (session?.exec) {
      try {
        await session.exec.resize({
          h: data.rows,
          w: data.cols,
        });
      } catch (error) {
        this.logger.error(`Failed to resize terminal: ${error.message}`);
      }
    }
  }
}
