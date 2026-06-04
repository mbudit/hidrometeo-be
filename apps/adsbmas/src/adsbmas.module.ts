import { Module } from '@nestjs/common';
import { AdsbmasController } from './adsbmas.controller.js';
import { AdsbmasService } from './adsbmas.service.js';

@Module({
  imports: [],
  controllers: [AdsbmasController],
  providers: [AdsbmasService],
})
export class AdsbmasModule {}
