import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('courses')
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Req() req) {
    const userId = req.user?.sub;
    return this.courseService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user?.sub;
    return this.courseService.findOne(id, userId);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enroll(@Param('id') id: string, @Req() req) {
    return this.courseService.enroll(id, req.user.sub);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  async getProgress(@Param('id') id: string, @Req() req) {
    return this.courseService.getProgress(id, req.user.sub);
  }
}
