import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, userId?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        steps: {
          orderBy: { order: 'asc' },
        },
        submissions: userId ? {
          where: { userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        } : false,
      },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    return {
      ...lab,
      lastSubmission: userId && lab.submissions?.[0],
      submissions: undefined,
    };
  }

  async findByCourse(courseId: string) {
    return this.prisma.lab.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        steps: {
          select: {
            id: true,
            title: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async submit(labId: string, userId: string, code?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
    });

    if (!lab) {
      throw new NotFoundException('Lab not found');
    }

    // 创建提交记录
    const submission = await this.prisma.submission.create({
      data: {
        userId,
        labId,
        status: 'pending',
        maxScore: lab.points,
      },
    });

    // 如果有自动判题脚本，执行判题
    if (lab.judgeType === 'auto' && lab.judgeScript) {
      // TODO: 实现自动判题逻辑
      // 这里需要调用 Docker 服务执行判题脚本
    }

    return submission;
  }
}
