import { Controller, Get } from '@nestjs/common';
import { VimsService } from './vims.service.js';

@Controller()
export class VimsController {
  constructor(private readonly vimsService: VimsService) {}

  @Get()
  getStatus() {
    return this.vimsService.getStatus();
  }
}
