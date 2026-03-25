import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== 用户管理 ====================
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        qqNumber: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            containers: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: { username: string; email: string; password: string; role?: string; qqNumber?: string }) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'STUDENT',
        qqNumber: data.qqNumber,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        qqNumber: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  // ==================== 课程管理 ====================
  async createCourse(data: any) {
    return this.prisma.course.create({ data });
  }

  async updateCourse(id: string, data: any) {
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async deleteCourse(id: string) {
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted successfully' };
  }

  // ==================== 实验管理 ====================
  async createLab(data: any) {
    return this.prisma.lab.create({ data });
  }

  async updateLab(id: string, data: any) {
    return this.prisma.lab.update({
      where: { id },
      data,
    });
  }

  async deleteLab(id: string) {
    await this.prisma.lab.delete({ where: { id } });
    return { message: 'Lab deleted successfully' };
  }

  // ==================== 容器管理 ====================
  async getAllContainers() {
    return this.prisma.container.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        lab: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async forceStopContainer(id: string) {
    // TODO: 调用 Docker 服务强制停止
    await this.prisma.container.update({
      where: { id },
      data: {
        status: 'stopped',
        stoppedAt: new Date(),
      },
    });
    return { message: 'Container force stopped' };
  }

  // ==================== 统计数据 ====================
  async getStats() {
    const [
      totalUsers,
      totalCourses,
      totalLabs,
      activeContainers,
      totalSubmissions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.lab.count(),
      this.prisma.container.count({ where: { status: 'running' } }),
      this.prisma.submission.count(),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalLabs,
      activeContainers,
      totalSubmissions,
    };
  }
}
