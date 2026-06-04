import { Controller, Get } from '@nestjs/common';
import { ApmsService } from './apms.service.js';

@Controller()
export class ApmsController {
  constructor(private readonly apmsService: ApmsService) {}

  @Get()
  getStatus() {
    return this.apmsService.getStatus();
  }
}
