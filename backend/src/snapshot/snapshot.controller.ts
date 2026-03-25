import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('snapshots')
@UseGuards(JwtAuthGuard)
export class SnapshotController {
  constructor(private snapshotService: SnapshotService) {}

  @Post()
  async create(
    @Body() body: { containerId: string; name: string; description?: string },
    @Req() req,
  ) {
    return this.snapshotService.create(
      req.user.sub,
      body.containerId,
      body.name,
      body.description,
    );
  }

  @Get()
  async findAll(@Req() req) {
    return this.snapshotService.findByUser(req.user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.snapshotService.findOne(id, req.user.sub);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Req() req) {
    return this.snapshotService.restore(id, req.user.sub);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.snapshotService.remove(id, req.user.sub);
  }
}
