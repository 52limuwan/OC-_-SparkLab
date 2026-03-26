import { Injectable, Logger } from '@nestjs/common';
import { NodeSSH } from 'node-ssh';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface DockerContainerInfo {
  id: string;
  name: string;
  status: string;
  ports: { [key: string]: number };
}

@Injectable()
export class SSHService {
  private readonly logger = new Logger(SSHService.name);
  private connections = new Map<string, NodeSSH>();

  async connect(serverId: string, config: SSHConfig): Promise<NodeSSH> {
    this.logger.log(`Connecting to ${config.host}:${config.port}`);
    
    const ssh = new NodeSSH();
    
    try {
      await ssh.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        readyTimeout: 10000,
      });
      
      this.connections.set(serverId, ssh);
      this.logger.log(`Connected to ${config.host}`);
      return ssh;
    } catch (error) {
      this.logger.error(`Failed to connect to ${config.host}: ${error.message}`);
      throw error;
    }
  }

  async disconnect(serverId: string) {
    const ssh = this.connections.get(serverId);
    if (ssh) {
      ssh.dispose();
      this.connections.delete(serverId);
      this.logger.log(`Disconnected from server ${serverId}`);
    }
  }

  getConnection(serverId: string): NodeSSH | undefined {
    return this.connections.get(serverId);
  }

  async execCommand(serverId: string, command: string): Promise<{ stdout: string; stderr: string }> {
    const ssh = this.connections.get(serverId);
    if (!ssh) {
      throw new Error(`No SSH connection for server ${serverId}`);
    }

    this.logger.log(`Executing: ${command}`);
    const result = await ssh.execCommand(command);
    
    if (result.code !== 0) {
      this.logger.warn(`Command failed with code ${result.code}: ${result.stderr}`);
    }
    
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  // Docker 相关操作
  async dockerPull(serverId: string, image: string): Promise<void> {
    await this.execCommand(serverId, `docker pull ${image}`);
  }

  async dockerCreate(serverId: string, options: {
    image: string;
    name: string;
    cpuLimit: number;
    memoryLimit: number;
  }): Promise<DockerContainerInfo> {
    const { image, name, cpuLimit, memoryLimit } = options;
    
    // 创建容器
    const createCmd = `docker run -d --name ${name} \
      --cpus=${cpuLimit} \
      --memory=${memoryLimit}m \
      -p 0:22 -p 0:5900 -p 0:8080 \
      ${image}`;
    
    const { stdout } = await this.execCommand(serverId, createCmd);
    const containerId = stdout.trim();
    
    // 获取端口映射
    const inspectCmd = `docker inspect ${containerId} --format='{{json .NetworkSettings.Ports}}'`;
    const { stdout: portsJson } = await this.execCommand(serverId, inspectCmd);
    
    const ports = JSON.parse(portsJson);
    
    return {
      id: containerId,
      name,
      status: 'running',
      ports: {
        ssh: ports['22/tcp']?.[0]?.HostPort ? parseInt(ports['22/tcp'][0].HostPort) : null,
        vnc: ports['5900/tcp']?.[0]?.HostPort ? parseInt(ports['5900/tcp'][0].HostPort) : null,
        ide: ports['8080/tcp']?.[0]?.HostPort ? parseInt(ports['8080/tcp'][0].HostPort) : null,
      },
    };
  }

  async dockerStart(serverId: string, containerId: string): Promise<void> {
    await this.execCommand(serverId, `docker start ${containerId}`);
  }

  async dockerStop(serverId: string, containerId: string): Promise<void> {
    await this.execCommand(serverId, `docker stop ${containerId}`);
  }

  async dockerRemove(serverId: string, containerId: string): Promise<void> {
    await this.execCommand(serverId, `docker rm -f ${containerId}`);
  }

  async dockerExec(serverId: string, containerId: string, command: string): Promise<string> {
    const { stdout } = await this.execCommand(
      serverId,
      `docker exec ${containerId} /bin/sh -c "${command.replace(/"/g, '\\"')}"`
    );
    return stdout;
  }

  async dockerCommit(serverId: string, containerId: string, imageName: string): Promise<string> {
    const { stdout } = await this.execCommand(
      serverId,
      `docker commit ${containerId} ${imageName}`
    );
    return stdout.trim();
  }

  async getSystemInfo(serverId: string): Promise<{
    cpuUsage: number;
    memoryUsage: number;
    activeContainers: number;
  }> {
    // CPU 使用率
    const { stdout: cpuOut } = await this.execCommand(
      serverId,
      `top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1`
    );
    
    // 内存使用率
    const { stdout: memOut } = await this.execCommand(
      serverId,
      `free | grep Mem | awk '{print ($3/$2) * 100.0}'`
    );
    
    // 活跃容器数
    const { stdout: containerOut } = await this.execCommand(
      serverId,
      `docker ps -q | wc -l`
    );
    
    return {
      cpuUsage: parseFloat(cpuOut.trim()) || 0,
      memoryUsage: parseFloat(memOut.trim()) || 0,
      activeContainers: parseInt(containerOut.trim()) || 0,
    };
  }

  async checkDockerInstalled(serverId: string): Promise<boolean> {
    try {
      await this.execCommand(serverId, 'docker --version');
      return true;
    } catch {
      return false;
    }
  }
}
