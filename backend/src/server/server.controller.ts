import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServerService } from './server.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('servers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServerController {
  constructor(private serverService: ServerService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createDto: {
    name: string;
  }) {
    return this.serverService.create(createDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.serverService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.serverService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.serverService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.serverService.remove(id);
  }
}
