import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';

interface PortMapping {
  containerPort: number;
  hostPort?: number;
  protocol: 'tcp' | 'udp';
  random: boolean;
}

interface EnvironmentVar {
  name: string;
  value: string;
}

interface VolumeMount {
  hostPath: string;
  containerPath: string;
  mode: 'ro' | 'rw';
}

interface CreateContainerOptions {
  image: string;
  name: string;
  cpuLimit: number;
  memoryLimit: number;
  portMappings?: PortMapping[];
  environmentVars?: EnvironmentVar[];
  volumeMounts?: VolumeMount[];
  restartPolicy?: 'no' | 'always' | 'unless-stopped' | 'on-failure';
}

interface CreateContainerResult {
  id: string;
  portMappings: Array<{
    containerPort: number;
    hostPort: number;
    protocol: 'tcp' | 'udp';
  }>;
}

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private docker: Docker;

  constructor() {
    const dockerHost = process.env.DOCKER_HOST;
    if (dockerHost && dockerHost.startsWith('tcp://')) {
      const url = new URL(dockerHost);
      this.docker = new Docker({ host: url.hostname, port: parseInt(url.port) });
    } else {
      this.docker = new Docker({
        socketPath: dockerHost || '/var/run/docker.sock',
      });
    }
  }

  async createContainer(options: CreateContainerOptions): Promise<CreateContainerResult> {
    this.logger.log(`Creating container: ${options.name}`);

    try {
      await this.pullImage(options.image);

      const containerConfig: Docker.ContainerCreateOptions = {
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
          (ev) => `${ev.name}=${ev.value}`
        );
      }

      if (options.volumeMounts && options.volumeMounts.length > 0) {
        containerConfig.HostConfig!.Binds = options.volumeMounts.map(
          (vm) => `${vm.hostPath}:${vm.containerPath}:${vm.mode}`
        );
      }



      const container = await this.docker.createContainer(containerConfig);
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

  async execCreate(containerId: string, command: string, options?: any) {
    this.logger.log(`Creating exec instance in ${containerId}: ${command}`);
    
    const container = this.docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: command.split(' '),
      Tty: options?.tty ?? true,
      AttachStdin: options?.stdin ?? true,
      AttachStdout: options?.stdout ?? true,
      AttachStderr: options?.stderr ?? true,
    });

    return { execId: exec.id };
  }

  async execStart(containerId: string, execId: string, options?: any) {
    this.logger.log(`Starting exec instance ${execId} in ${containerId}`);
    
    const exec = this.docker.getExec(execId);
    const stream = await exec.start({
      hijack: options?.stream ?? false,
      stdin: options?.stdin ?? true,
    });

    if (options?.stream) {
      return { streaming: true, stream };
    } else {
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
      await this.docker.getImage(image).inspect();
      this.logger.log(`Image ${image} already exists`);
    } catch (error) {
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
