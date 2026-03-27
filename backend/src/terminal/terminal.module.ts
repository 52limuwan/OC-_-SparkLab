import { Module } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { ServerModule } from '../server/server.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ServerModule, PrismaModule],
  providers: [TerminalGateway],
})
export class TerminalModule {}
