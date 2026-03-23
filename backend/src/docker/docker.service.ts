import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private mockContainers = new Map<string, any>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createContainer(userId: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (user.containerId) {
        const existing = this.mockContainers.get(user.containerId);
        if (existing) {
          this.logger.log(`Reusing existing container for user ${userId}`);
          return { containerId: user.containerId, status: 'running' };
        }
      }

      // 创建模拟容器
      const containerId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      this.mockContainers.set(containerId, {
        id: containerId,
        userId,
        status: 'running',
        createdAt: new Date(),
      });

      user.containerId = containerId;
      await this.userRepository.save(user);

      this.logger.log(`Mock container created for user ${userId}: ${containerId}`);
      
      return { containerId, status: 'created' };
    } catch (error) {
      this.logger.error(`Failed to create container: ${error.message}`);
      throw error;
    }
  }

  async getContainer(containerId: string) {
    return this.mockContainers.get(containerId);
  }

  async stopContainer(containerId: string) {
    const container = this.mockContainers.get(containerId);
    if (container) {
      container.status = 'stopped';
      this.logger.log(`Mock container stopped: ${containerId}`);
    }
  }

  async removeContainer(containerId: string) {
    this.mockContainers.delete(containerId);
    this.logger.log(`Mock container removed: ${containerId}`);
  }

  async execCommand(containerId: string, command: string) {
    this.logger.log(`Executing command in mock container ${containerId}: ${command}`);
    return `Mock output for: ${command}`;
  }
}
