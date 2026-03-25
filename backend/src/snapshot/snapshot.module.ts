import { Module } from '@nestjs/common';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';
import { ContainerModule } from '../container/container.module';

@Module({
  imports: [ContainerModule],
  controllers: [SnapshotController],
  providers: [SnapshotService],
})
export class SnapshotModule {}
