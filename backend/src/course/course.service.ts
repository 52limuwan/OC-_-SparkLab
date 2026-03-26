import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    console.log('CourseService.findAll called with userId:', userId);
    
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        labs: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
        enrollments: userId ? {
          where: { userId },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = courses.map(course => {
      const isEnrolled = userId ? (course.enrollments?.length || 0) > 0 : false;
      console.log(`Course ${course.id}: isEnrolled=${isEnrolled}, enrollments count=${course.enrollments?.length || 0}`);
      
      return {
        ...course,
        labCount: course.labs.length,
        isEnrolled,
        enrollments: undefined,
      };
    });

    return result;
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        labs: {
          orderBy: { order: 'asc' },
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
        enrollments: userId ? {
          where: { userId },
        } : false,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return {
      ...course,
      isEnrolled: userId ? course.enrollments?.length > 0 : false,
      progress: userId && course.enrollments?.[0]?.progress || 0,
      enrollments: undefined,
    };
  }

  async enroll(courseId: string, userId: string) {
    console.log('CourseService.enroll called:', { courseId, userId });
    
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
      },
      update: {},
    });

    console.log('Enrollment created/updated:', enrollment);
    return enrollment;
  }

  async getProgress(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return enrollment || { progress: 0 };
  }
}
