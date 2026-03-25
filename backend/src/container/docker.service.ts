import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';

interface CreateContainerOptions {
  image: string;
  cpuLimit: number;
  memoryLimit: number;
  name: string;
}

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock',
    });
  }

  async createContainer(options: CreateContainerOptions) {
    this.logger.log(`Creating container: ${options.name}`);

    try {
      // 拉取镜像（如果不存在）
      await this.pullImage(options.image);

      // 创建容器
      const container = await this.docker.createContainer({
        Image: options.image,
        name: options.name,
        Tty: true,
        OpenStdin: true,
        HostConfig: {
          Memory: options.memoryLimit * 1024 * 1024, // MB to bytes
          NanoCpus: options.cpuLimit * 1000000000, // CPU limit
          PublishAllPorts: true,
          AutoRemove: false,
        },
        ExposedPorts: {
          '22/tcp': {}, // SSH
          '5900/tcp': {}, // VNC
          '8080/tcp': {}, // IDE
        },
      });

      // 启动容器
      await container.start();

      // 获取端口映射
      const inspect = await container.inspect();
      const ports = inspect.NetworkSettings.Ports;

      return {
        id: container.id,
        sshPort: ports['22/tcp']?.[0]?.HostPort ? parseInt(ports['22/tcp'][0].HostPort) : null,
        vncPort: ports['5900/tcp']?.[0]?.HostPort ? parseInt(ports['5900/tcp'][0].HostPort) : null,
        idePort: ports['8080/tcp']?.[0]?.HostPort ? parseInt(ports['8080/tcp'][0].HostPort) : null,
      };
    } catch (error) {
      this.logger.error(`Failed to create container: ${error.message}`);
      throw error;
    }
  }

  async startContainer(containerId: string) {
    this.logger.log(`Starting container: ${containerId}`);
    const container = this.docker.getContainer(containerId);
    await container.start();
  }

  async stopContainer(containerId: string) {
    this.logger.log(`Stopping container: ${containerId}`);
    const container = this.docker.getContainer(containerId);
    await container.stop();
  }

  async removeContainer(containerId: string) {
    this.logger.log(`Removing container: ${containerId}`);
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true });
  }

  async execCommand(containerId: string, command: string) {
    this.logger.log(`Executing command in ${containerId}: ${command}`);
    
    const container = this.docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['/bin/sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: false, stdin: false });
    
    return new Promise((resolve, reject) => {
      let output = '';
      
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      stream.on('end', () => {
        resolve({ output });
      });

      stream.on('error', reject);
    });
  }

  async commitContainer(containerId: string, imageName: string) {
    this.logger.log(`Creating snapshot: ${imageName}`);
    const container = this.docker.getContainer(containerId);
    const image = await container.commit({
      repo: imageName,
      tag: 'latest',
    });
    return image.Id;
  }

  async createFromSnapshot(imageId: string, name: string) {
    this.logger.log(`Creating container from snapshot: ${imageId}`);
    const container = await this.docker.createContainer({
      Image: imageId,
      name,
      Tty: true,
      OpenStdin: true,
      HostConfig: {
        PublishAllPorts: true,
      },
    });

    await container.start();
    return container.id;
  }

  private async pullImage(image: string) {
    try {
      // 检查镜像是否存在
      await this.docker.getImage(image).inspect();
      this.logger.log(`Image ${image} already exists`);
    } catch (error) {
      // 镜像不存在，拉取
      this.logger.log(`Pulling image: ${image}`);
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err, stream) => {
          if (err) return reject(err);
          
          this.docker.modem.followProgress(stream, (err, output) => {
            if (err) return reject(err);
            resolve(output);
          });
        });
      });
    }
  }
}
