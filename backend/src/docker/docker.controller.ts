import { Controller, Post, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { DockerService } from './docker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('docker')
@UseGuards(JwtAuthGuard)
export class DockerController {
  constructor(private dockerService: DockerService) {}

  @Post('container/create')
  async createContainer(@Request() req) {
    return this.dockerService.createContainer(req.user.userId);
  }

  @Post('container/:id/stop')
  async stopContainer(@Param('id') id: string) {
    return this.dockerService.stopContainer(id);
  }

  @Delete('container/:id')
  async removeContainer(@Param('id') id: string) {
    return this.dockerService.removeContainer(id);
  }
}
