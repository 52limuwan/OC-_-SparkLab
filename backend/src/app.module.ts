import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DockerModule } from './docker/docker.module';
import { TerminalModule } from './terminal/terminal.module';
import { LabModule } from './lab/lab.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: 'docker_lab.db',
      autoSave: true,
      autoLoadEntities: true,
      synchronize: true, // 开发环境自动同步
    }),
    AuthModule,
    DockerModule,
    TerminalModule,
    LabModule,
  ],
})
export class AppModule {}
