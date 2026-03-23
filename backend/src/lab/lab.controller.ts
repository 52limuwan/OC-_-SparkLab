import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LabService } from './lab.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('labs')
@UseGuards(JwtAuthGuard)
export class LabController {
  constructor(private labService: LabService) {}

  @Get()
  async findAll() {
    return this.labService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.labService.findOne(id);
  }

  @Post()
  async create(@Body() labData: any) {
    return this.labService.create(labData);
  }
}
