import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: registerDto.username },
          ...(registerDto.qqNumber ? [{ qqNumber: registerDto.qqNumber }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or QQ number already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        displayName: registerDto.displayName,
        email: `${registerDto.username}@sparklab.local`, // 生成默认邮箱
        password: hashedPassword,
        role: 'STUDENT',
        qqNumber: registerDto.qqNumber,
      },
    });
    
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    // 支持用户名或QQ号登录
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: loginDto.username },
          { qqNumber: loginDto.username }, // 使用username字段传递QQ号
        ],
      },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 更新最后活跃时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        qqNumber: user.qqNumber,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ 
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        avatar: true,
        qqNumber: true,
        createdAt: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        avatar: true,
        qqNumber: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // 检查用户名是否已被占用
    if (updateProfileDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: updateProfileDto.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // 检查QQ号是否已被占用
    if (updateProfileDto.qqNumber) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          qqNumber: updateProfileDto.qqNumber,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('QQ number already exists');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        avatar: true,
        qqNumber: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    return user;
  }

  async getUserStats(userId: string) {
    // 获取已注册课程数
    const enrolledCourses = await this.prisma.enrollment.count({
      where: { userId },
    });

    // 获取完成的实验数
    const completedLabs = await this.prisma.submission.count({
      where: {
        userId,
        status: 'passed',
      },
    });

    // 获取总积分
    const submissions = await this.prisma.submission.findMany({
      where: {
        userId,
        status: 'passed',
      },
      select: {
        score: true,
      },
    });

    const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);

    // 获取学习时长（基于容器使用时间）
    const containers = await this.prisma.container.findMany({
      where: { userId },
      select: {
        createdAt: true,
        stoppedAt: true,
      },
    });

    let studyTime = 0;
    containers.forEach((container) => {
      if (container.stoppedAt) {
        const duration = container.stoppedAt.getTime() - container.createdAt.getTime();
        studyTime += Math.floor(duration / 1000 / 60); // 转换为分钟
      }
    });

    return {
      enrolledCourses,
      completedLabs,
      totalScore,
      studyTime,
    };
  }
}