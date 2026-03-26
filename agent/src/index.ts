import { io, Socket } from 'socket.io-client';
import Docker from 'dockerode';
import si from 'systeminformation';
import * as fs from 'fs';
import * as path from 'path';

interface AgentConfig {
  serverUrl: string;
  agentToken: string;
  serverName: string;
  maxContainers: number;
}

class SparkLabAgent {
  private socket: Socket | null = null;
  private docker: Docker;
  private config: AgentConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    this.connect();
  }

  private loadConfig(configPath: string): AgentConfig {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  }

  private connect() {
    console.log(`[Agent] 连接到中心服务器: ${this.config.serverUrl}`);

    this.socket = io(this.config.serverUrl, {
      auth: {
        token: this.config.agentToken,
        serverName: this.config.serverName,
      },
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Agent] 已连接到中心服务器');
      this.reconnectAttempts = 0;
      this.sendHeartbeat();
      this.startHeartbeatInterval();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[Agent] 断开连接: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Agent] 连接错误:', error.message);
      this.reconnectAttempts++;
    });

    // 接收指令
    this.socket.on('docker:create', (data, callback) => this.handleCreateContainer(data, callback));
    this.socket.on('docker:start', (data, callback) => this.handleStartContainer(data, callback));
    this.socket.on('docker:stop', (data, callback) => this.handleStopContainer(data, callback));
    this.socket.on('docker:remove', (data, callback) => this.handleRemoveContainer(data, callback));
    this.socket.on('docker:exec', (data, callback) => this.handleExecCommand(data, callback));
    this.socket.on('docker:commit', (data, callback) => this.handleCommitContainer(data, callback));
    this.socket.on('system:stats', (data, callback) => this.handleGetStats(data, callback));
  }

  private startHeartbeatInterval() {
    setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 每30秒发送一次心跳
  }

  private async sendHeartbeat() {
    if (!this.socket?.connected) return;

    try {
      const stats = await this.getSystemStats();
      this.socket.emit('agent:heartbeat', stats);
    } catch (error) {
      console.error('[Agent] 心跳发送失败:', error);
    }
  }

  private async getSystemStats() {
    const [cpu, mem, containers] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      this.docker.listContainers(),
    ]);

    return {
      cpuUsage: cpu.currentLoad,
      memoryUsage: (mem.used / mem.total) * 100,
      totalMemory: Math.floor(mem.total / 1024 / 1024), // MB
      activeContainers: containers.length,
      maxContainers: this.config.maxContainers,
      timestamp: new Date().toISOString(),
    };
  }

  // Docker 操作处理
  private async handleCreateContainer(data: any, callback: Function) {
    try {
      console.log(`[Agent] 创建容器: ${data.name}`);

      // 拉取镜像
      await this.pullImage(data.image);

      // 创建容器
      const container = await this.docker.createContainer({
        Image: data.image,
        name: data.name,
        Tty: true,
        OpenStdin: true,
        HostConfig: {
          Memory: data.memoryLimit * 1024 * 1024,
          NanoCpus: data.cpuLimit * 1000000000,
          PublishAllPorts: true,
          AutoRemove: false,
        },
        ExposedPorts: {
          '22/tcp': {},
          '5900/tcp': {},
          '8080/tcp': {},
        },
      });

      // 启动容器
      await container.start();

      // 获取端口映射
      const inspect = await container.inspect();
      const ports = inspect.NetworkSettings.Ports;

      callback({
        success: true,
        data: {
          id: container.id,
          sshPort: ports['22/tcp']?.[0]?.HostPort ? parseInt(ports['22/tcp'][0].HostPort) : null,
          vncPort: ports['5900/tcp']?.[0]?.HostPort ? parseInt(ports['5900/tcp'][0].HostPort) : null,
          idePort: ports['8080/tcp']?.[0]?.HostPort ? parseInt(ports['8080/tcp'][0].HostPort) : null,
        },
      });
    } catch (error: any) {
      console.error('[Agent] 创建容器失败:', error.message);
      callback({ success: false, error: error.message });
    }
  }

  private async handleStartContainer(data: any, callback: Function) {
    try {
      console.log(`[Agent] 启动容器: ${data.containerId}`);
      const container = this.docker.getContainer(data.containerId);
      await container.start();
      callback({ success: true });
    } catch (error: any) {
      console.error('[Agent] 启动容器失败:', error.message);
      callback({ success: false, error: error.message });
    }
  }

  private async handleStopContainer(data: any, callback: Function) {
    try {
      console.log(`[Agent] 停止容器: ${data.containerId}`);
      const container = this.docker.getContainer(data.containerId);
      await container.stop();
      callback({ success: true });
    } catch (error: any) {
      console.error('[Agent] 停止容器失败:', error.message);
      callback({ success: false, error: error.message });
    }
  }

  private async handleRemoveContainer(data: any, callback: Function) {
    try {
      console.log(`[Agent] 删除容器: ${data.containerId}`);
      const container = this.docker.getContainer(data.containerId);
      await container.remove({ force: true });
      callback({ success: true });
    } catch (error: any) {
      console.error('[Agent] 删除容器失败:', error.message);
      callback({ success: false, error: error.message });
    }
  }

  private async handleExecCommand(data: any, callback: Function) {
    try {
      console.log(`[Agent] 执行命令: ${data.command}`);
      const container = this.docker.getContainer(data.containerId);
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', data.command],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: false, stdin: false });
      let output = '';

      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      stream.on('end', () => {
        callback({ success: true, output });
      });

      stream.on('error', (error) => {
        callback({ success: false, error: error.message });
      });
    } catch (error: any) {
      console.error('[Agent] 执行命令失败:', error.message);
      callback({ success: false, error: error.message });
    }
  }

  private async handleCommitContainer(data: any, callback: Function) {
    try {
      console.log(`[Agent] 创建快照: ${data.imageName}`);
      const container = this.docker.getContainer(data.containerId);
      const image = await container.commit({
        repo: data.imageName,
        tag: 'latest',
      });
      callback({ success: true, imageId: image.Id });
    } catch (error: any) {
      console.error('[Agent] 创建快照失败:', error.message);
      callback({ success: false, error: error.message });
    }
  }

  private async handleGetStats(data: any, callback: Function) {
    try {
      const stats = await this.getSystemStats();
      callback({ success: true, data: stats });
    } catch (error: any) {
      callback({ success: false, error: error.message });
    }
  }

  private async pullImage(image: string) {
    try {
      await this.docker.getImage(image).inspect();
      console.log(`[Agent] 镜像已存在: ${image}`);
    } catch (error) {
      console.log(`[Agent] 拉取镜像: ${image}`);
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err: any, stream: any) => {
          if (err) return reject(err);
          this.docker.modem.followProgress(stream, (err: any, output: any) => {
            if (err) return reject(err);
            resolve(output);
          });
        });
      });
    }
  }
}

// 启动 Agent
const configPath = process.env.CONFIG_PATH || '/etc/spark-lab-agent/config.json';

if (!fs.existsSync(configPath)) {
  console.error(`配置文件不存在: ${configPath}`);
  console.log('请创建配置文件，示例:');
  console.log(JSON.stringify({
    serverUrl: 'http://your-server:3001',
    agentToken: 'your-secret-token',
    serverName: 'Server-1',
    maxContainers: 10,
  }, null, 2));
  process.exit(1);
}

const agent = new SparkLabAgent(configPath);

console.log('[Agent] Spark Lab Agent 已启动');
console.log('[Agent] 按 Ctrl+C 退出');

process.on('SIGINT', () => {
  console.log('\n[Agent] 正在关闭...');
  process.exit(0);
});
