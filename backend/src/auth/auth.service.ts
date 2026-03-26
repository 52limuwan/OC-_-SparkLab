import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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
        email: registerDto.email || `${registerDto.username}@sparklab.local`, // 生成默认邮箱
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
}
