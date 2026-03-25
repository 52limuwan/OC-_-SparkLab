import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { LabModule } from './lab/lab.module';
import { ContainerModule } from './container/container.module';
import { SnapshotModule } from './snapshot/snapshot.module';
import { TerminalModule } from './terminal/terminal.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CourseModule,
    LabModule,
    ContainerModule,
    SnapshotModule,
    TerminalModule,
    AdminModule,
  ],
})
export class AppModule {}
