import { Module } from '@nestjs/common';
import { AdsbmasGateway } from './adsbmas.gateway.js';

@Module({
  providers: [AdsbmasGateway],
  exports: [AdsbmasGateway],
})
export class GatewayModule {}
