import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { LabService } from './lab.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('labs')
export class LabController {
  constructor(private labService: LabService) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user?.sub;
    return this.labService.findOne(id, userId);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.labService.findByCourse(courseId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submit(
    @Param('id') id: string,
    @Body() body: { code?: string },
    @Req() req,
  ) {
    return this.labService.submit(id, req.user.sub, body.code);
  }
}
