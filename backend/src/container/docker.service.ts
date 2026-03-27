import { Injectable, Logger } from '@nestjs/common';

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
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.DOCKER_GO_URL || 'http://127.0.0.1:8085').replace(/\/+$/, '');
  }

  async createContainer(options: CreateContainerOptions): Promise<CreateContainerResult> {
    this.logger.log(`Creating container: ${options.name}`);

    try {
      return await this.request<CreateContainerResult>('/containers', {
        method: 'POST',
        body: options,
      });
    } catch (error) {
      this.logger.error(`Failed to create container: ${error.message}`);
      throw error;
    }
  }

  async startContainer(containerId: string) {
    this.logger.log(`Starting container: ${containerId}`);
    await this.request(`/containers/${encodeURIComponent(containerId)}/start`, { method: 'POST' });
  }

  async stopContainer(containerId: string) {
    this.logger.log(`Stopping container: ${containerId}`);
    await this.request(`/containers/${encodeURIComponent(containerId)}/stop`, { method: 'POST' });
  }

  async removeContainer(containerId: string) {
    this.logger.log(`Removing container: ${containerId}`);
    await this.request(`/containers/${encodeURIComponent(containerId)}`, { method: 'DELETE' });
  }

  async execCommand(containerId: string, command: string) {
    this.logger.log(`Executing command in ${containerId}: ${command}`);
    return await this.request(`/containers/${encodeURIComponent(containerId)}/exec`, {
      method: 'POST',
      body: { command },
    });
  }

  async execCreate(containerId: string, command: string, options?: any) {
    this.logger.log(`Creating exec instance in ${containerId}: ${command}`);
    return await this.request(`/containers/${encodeURIComponent(containerId)}/exec/create`, {
      method: 'POST',
      body: { command, options },
    });
  }

  async execStart(containerId: string, execId: string, options?: any) {
    this.logger.log(`Starting exec instance ${execId} in ${containerId}`);
    // Note: streaming mode is not supported over this HTTP bridge yet.
    if (options?.stream) {
      return { streaming: true };
    }
    return await this.request(`/exec/${encodeURIComponent(execId)}/start`, {
      method: 'POST',
      body: { stream: false },
    });
  }

  async commitContainer(containerId: string, imageName: string) {
    this.logger.log(`Creating snapshot: ${imageName}`);
    const res = await this.request<{ imageId: string }>(`/containers/${encodeURIComponent(containerId)}/commit`, {
      method: 'POST',
      body: { imageName },
    });
    return res.imageId;
  }

  async createFromSnapshot(imageId: string, name: string) {
    this.logger.log(`Creating container from snapshot: ${imageId}`);
    const res = await this.request<{ id: string }>('/containers/from-snapshot', {
      method: 'POST',
      body: { imageId, name },
    });
    return res.id;
  }

  private async request<T = any>(
    path: string,
    init: { method: 'GET' | 'POST' | 'DELETE'; body?: any; timeoutMs?: number },
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 120000);

    try {
      const res = await fetch(url, {
        method: init.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : undefined;

      if (!res.ok) {
        const message = data?.error || res.statusText || 'Docker-Go request failed';
        throw new Error(message);
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
