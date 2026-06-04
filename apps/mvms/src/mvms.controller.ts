import { Controller, Get } from '@nestjs/common';
import { MvmsService } from './mvms.service.js';

@Controller()
export class MvmsController {
  constructor(private readonly mvmsService: MvmsService) {}

  @Get()
  getStatus() {
    return this.mvmsService.getStatus();
  }
}
