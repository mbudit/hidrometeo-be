import { Controller, Get } from '@nestjs/common';
import { MdpsService } from './mdps.service.js';

@Controller()
export class MdpsController {
  constructor(private readonly mdpsService: MdpsService) {}

  @Get()
  getStatus() {
    return this.mdpsService.getStatus();
  }
}
