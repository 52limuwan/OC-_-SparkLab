import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { Lab } from './entities/lab.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lab])],
  controllers: [LabController],
  providers: [LabService],
})
export class LabModule {}
