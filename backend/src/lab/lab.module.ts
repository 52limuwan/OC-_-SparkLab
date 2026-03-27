import { Module } from '@nestjs/common';
import { LabController } from './lab.controller';
import { LabService } from './lab.service';
import { ContainerModule } from '../container/container.module';
import { ServerModule } from '../server/server.module';

@Module({
  imports: [ContainerModule, ServerModule],
  controllers: [LabController],
  providers: [LabService],
  exports: [LabService],
})
export class LabModule {}
