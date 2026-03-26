import { Module } from '@nestjs/common';
import { AgentGateway } from './agent.gateway';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentController],
  providers: [AgentGateway, AgentService],
  exports: [AgentGateway, AgentService],
})
export class AgentModule {}
