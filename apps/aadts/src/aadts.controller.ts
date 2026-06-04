import { Controller, Get } from '@nestjs/common';
import { AadtsService } from './aadts.service.js';

@Controller()
export class AadtsController {
  constructor(private readonly aadtsService: AadtsService) {}

  @Get()
  getStatus() {
    return this.aadtsService.getStatus();
  }
}
