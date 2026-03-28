import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import { Readable } from 'stream';

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
  private readonly docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async createContainer(options: CreateContainerOptions): Promise<CreateContainerResult> {
    this.logger.log(`Creating container: ${options.name}`);

    try {
      await this.ensureImage(options.image);

      const exposedPorts: { [port: string]: {} } = {};
      const portBindings: { [port: string]: Array<{ HostPort: string; HostIp?: string }> } = {};

      if (options.portMappings) {
        for (const pm of options.portMappings) {
          const proto = pm.protocol || 'tcp';
          const portKey = `${pm.containerPort}/${proto}`;
          exposedPorts[portKey] = {};

          if (pm.random) {
            portBindings[portKey] = [{ HostPort: '' }];
          } else if (pm.hostPort) {
            portBindings[portKey] = [{ HostPort: String(pm.hostPort) }];
          }
        }
      }

      const env: string[] = [];
      if (options.environmentVars) {
        for (const e of options.environmentVars) {
          env.push(`${e.name}=${e.value}`);
        }
      }

      const binds: string[] = [];
      if (options.volumeMounts) {
        for (const v of options.volumeMounts) {
          const mode = v.mode || 'rw';
          binds.push(`${v.hostPath}:${v.containerPath}:${mode}`);
        }
      }

      const restartPolicy = options.restartPolicy || 'unless-stopped';

      const container = await this.docker.createContainer({
        Image: options.image,
        name: options.name,
        Tty: true,
        OpenStdin: true,
        ExposedPorts: exposedPorts,
        Env: env,
        HostConfig: {
          Binds: binds,
          Memory: options.memoryLimit * 1024 * 1024,
          NanoCpus: options.cpuLimit * 1_000_000_000,
          PortBindings: portBindings,
          AutoRemove: false,
          RestartPolicy: { Name: restartPolicy },
        },
      });

      await container.start();

      const inspect = await container.inspect();
      const actualPorts: Array<{ containerPort: number; hostPort: number; protocol: 'tcp' | 'udp' }> = [];

      if (options.portMappings && inspect.NetworkSettings?.Ports) {
        for (const pm of options.portMappings) {
          const proto = pm.protocol || 'tcp';
          const portKey = `${pm.containerPort}/${proto}`;
          const bindings = inspect.NetworkSettings.Ports[portKey];

          if (bindings && bindings.length > 0 && bindings[0].HostPort) {
            const hostPort = parseInt(bindings[0].HostPort, 10);
            if (hostPort > 0) {
              actualPorts.push({
                containerPort: pm.containerPort,
                hostPort,
                protocol: proto as 'tcp' | 'udp',
              });
            }
          }
        }
      }

      return {
        id: container.id,
        portMappings: actualPorts,
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
    await container.stop({ t: 10 });
  }

  async removeContainer(containerId: string) {
    this.logger.log(`Removing container: ${containerId}`);
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true, v: true });
  }

  async execCommand(containerId: string, command: string) {
    this.logger.log(`Executing command in ${containerId}: ${command}`);
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ['/bin/sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    const stream = await exec.start({ Detach: false, Tty: false });
    const output = await this.streamToString(stream as Readable);

    return { output };
  }

  async execCreate(containerId: string, command: string, options?: any) {
    this.logger.log(`Creating exec instance in ${containerId}: ${command}`);
    const container = this.docker.getContainer(containerId);

    const cmd = command.split(/\s+/);
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    return { execId: exec.id };
  }

  async execStart(containerId: string, execId: string, options?: any) {
    this.logger.log(`Starting exec instance ${execId}`);

    if (options?.stream) {
      return { streaming: true };
    }

    const exec = this.docker.getExec(execId);
    const stream = await exec.start({ Detach: false, Tty: true });
    const output = await this.streamToString(stream as Readable);

    return { output };
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

  private async ensureImage(imageRef: string): Promise<void> {
    try {
      const image = this.docker.getImage(imageRef);
      await image.inspect();
      this.logger.log(`Image ${imageRef} already exists`);
    } catch (error) {
      this.logger.log(`Pulling image ${imageRef}...`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(imageRef, (err: any, stream: Readable) => {
          if (err) return reject(err);

          this.docker.modem.followProgress(stream, (err: any) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    }
  }

  private async streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }
}
