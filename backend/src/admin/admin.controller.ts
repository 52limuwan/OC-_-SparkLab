import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== 用户管理 ====================
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== 课程管理 ====================
  @Post('courses')
  async createCourse(@Body() data: any) {
    return this.adminService.createCourse(data);
  }

  @Put('courses/:id')
  async updateCourse(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateCourse(id, data);
  }

  @Delete('courses/:id')
  async deleteCourse(@Param('id') id: string) {
    return this.adminService.deleteCourse(id);
  }

  // ==================== 实验管理 ====================
  @Post('labs')
  async createLab(@Body() data: any) {
    return this.adminService.createLab(data);
  }

  @Put('labs/:id')
  async updateLab(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateLab(id, data);
  }

  @Delete('labs/:id')
  async deleteLab(@Param('id') id: string) {
    return this.adminService.deleteLab(id);
  }

  // ==================== 容器管理 ====================
  @Get('containers')
  async getAllContainers() {
    return this.adminService.getAllContainers();
  }

  @Post('containers/:id/force-stop')
  async forceStopContainer(@Param('id') id: string) {
    return this.adminService.forceStopContainer(id);
  }

  // ==================== 统计数据 ====================
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
