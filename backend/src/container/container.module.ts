import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ContainerController } from './container.controller';
import { ContainerService } from './container.service';
import { DockerService } from './docker.service';
import { CleanupService } from './cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ServerModule } from '../server/server.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, ServerModule],
  controllers: [ContainerController],
  providers: [ContainerService, DockerService, CleanupService],
  exports: [ContainerService, DockerService],
})
export class ContainerModule {}
