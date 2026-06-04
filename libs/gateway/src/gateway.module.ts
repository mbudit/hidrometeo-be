import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service.js';

@Module({
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
