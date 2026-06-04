import { Controller, Get } from '@nestjs/common';
import { AdsbmasService } from './adsbmas.service.js';

@Controller()
export class AdsbmasController {
  constructor(private readonly adsbmasService: AdsbmasService) {}

  @Get()
  getStatus() {
    return this.adsbmasService.getStatus();
  }
}
