import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DockerService } from './docker.service';
import { DockerController } from './docker.controller';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [DockerController],
  providers: [DockerService],
  exports: [DockerService],
})
export class DockerModule {}
