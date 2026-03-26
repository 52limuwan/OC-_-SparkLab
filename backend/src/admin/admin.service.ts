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
        displayName: true,
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

  async createUser(data: { username: string; displayName: string; password: string; role?: string; qqNumber?: string }) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        email: `${data.username}@sparklab.local`, // 生成默认邮箱
        password: hashedPassword,
        role: data.role || 'STUDENT',
        qqNumber: data.qqNumber,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        qqNumber: true,
        createdAt: true,
      },
    });
  }

  async updateUser(id: string, data: { username?: string; displayName?: string; password?: string; role?: string; qqNumber?: string }) {
    const bcrypt = require('bcryptjs');
    const updateData: any = {};
    
    if (data.username) {
      updateData.username = data.username;
      updateData.email = `${data.username}@sparklab.local`; // 同步更新邮箱
    }
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
    if (data.role) updateData.role = data.role;
    if (data.qqNumber !== undefined) updateData.qqNumber = data.qqNumber;
    
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
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
            displayName: true,
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
      recentUsers,
      recentContainers,
      courseStats,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.lab.count(),
      this.prisma.container.count({ where: { status: 'running' } }),
      this.prisma.submission.count(),
      // 最近活跃的用户
      this.prisma.user.findMany({
        take: 5,
        orderBy: { lastActiveAt: 'desc' },
        select: {
          id: true,
          username: true,
          displayName: true,
          qqNumber: true,
          role: true,
          lastActiveAt: true,
          _count: {
            select: {
              containers: true,
              submissions: true,
            },
          },
        },
      }),
      // 最近创建的容器
      this.prisma.container.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          lab: {
            select: {
              title: true,
            },
          },
        },
      }),
      // 课程统计
      this.prisma.course.findMany({
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              enrollments: true,
              labs: true,
            },
          },
        },
        orderBy: {
          enrollments: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // 计算容器总数
    const totalContainers = await this.prisma.container.count();

    // 按状态统计容器
    const containersByStatus = await this.prisma.container.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalUsers,
      totalCourses,
      totalLabs,
      activeContainers,
      totalContainers,
      totalSubmissions,
      recentUsers,
      recentContainers,
      courseStats,
      containersByStatus,
    };
  }
}
