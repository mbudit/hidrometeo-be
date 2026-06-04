import { Controller, Get } from '@nestjs/common';
import { SamsService } from './sams.service.js';

@Controller()
export class SamsController {
  constructor(private readonly samsService: SamsService) {}

  @Get()
  getStatus() {
    return this.samsService.getStatus();
  }
}
