import { Module } from '@nestjs/common';
import { WsdasController } from './wsdas.controller.js';
import { WsdasService } from './wsdas.service.js';

@Module({
  imports: [],
  controllers: [WsdasController],
  providers: [WsdasService],
})
export class WsdasModule {}
