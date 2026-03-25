import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    
    // 设置 HttpOnly Cookie
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: false, // 开发环境设为 false
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req) {
    try {
      // 尝试从cookie中获取token
      const token = req.cookies?.access_token;
      
      if (!token) {
        return { authenticated: false, user: null };
      }

      // 验证token并获取用户信息
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await this.authService.getProfile(decoded.sub);
      
      return { authenticated: true, user };
    } catch (error) {
      // Token无效或过期，返回未认证状态
      return { authenticated: false, user: null };
    }
  }

  @Get('profile-protected')
  @UseGuards(JwtAuthGuard)
  async getProfileProtected(@Req() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  check(@Req() req) {
    return { authenticated: true, user: req.user };
  }
}
