import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ServerModule } from '../server/server.module';

@Module({
  imports: [ServerModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
