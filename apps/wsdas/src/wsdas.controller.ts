import { Controller, Get } from '@nestjs/common';
import { WsdasService } from './wsdas.service.js';

@Controller()
export class WsdasController {
  constructor(private readonly wsdasService: WsdasService) {}

  @Get()
  getStatus() {
    return this.wsdasService.getStatus();
  }
}
