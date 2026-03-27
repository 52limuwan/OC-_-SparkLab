import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ContainerService } from './container.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('containers')
@UseGuards(JwtAuthGuard)
export class ContainerController {
  constructor(private containerService: ContainerService) {}

  @Post()
  async create(@Body() body: { labId: string }, @Req() req) {
    return this.containerService.create(req.user.sub, body.labId);
  }

  @Get()
  async findAll(@Req() req) {
    return this.containerService.findByUser(req.user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.containerService.findOne(id, req.user.sub, req.user.role);
  }

  @Post(':id/start')
  async start(@Param('id') id: string, @Req() req) {
    return this.containerService.start(id, req.user.sub, req.user.role);
  }

  @Post(':id/stop')
  async stop(@Param('id') id: string, @Req() req) {
    return this.containerService.stop(id, req.user.sub, req.user.role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.containerService.remove(id, req.user.sub, req.user.role);
  }

  @Post(':id/heartbeat')
  async heartbeat(@Param('id') id: string, @Req() req) {
    return this.containerService.updateHeartbeat(id, req.user.sub, req.user.role);
  }

  @Post(':id/exec')
  async exec(
    @Param('id') id: string,
    @Body() body: { command: string },
    @Req() req,
  ) {
    return this.containerService.execCommand(id, req.user.sub, body.command, req.user.role);
  }

  @Post(':id/exec/create')
  async execCreate(
    @Param('id') id: string,
    @Body() body: { command: string; options?: any },
    @Req() req,
  ) {
    return this.containerService.execCreate(id, req.user.sub, body.command, body.options, req.user.role);
  }

  @Post(':id/exec/start')
  async execStart(
    @Param('id') id: string,
    @Body() body: { execId: string; options?: any },
    @Req() req,
  ) {
    return this.containerService.execStart(id, req.user.sub, body.execId, body.options, req.user.role);
  }
}
