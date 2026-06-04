import { Module } from '@nestjs/common';
import { MdpsController } from './mdps.controller.js';
import { MdpsService } from './mdps.service.js';

@Module({
  imports: [],
  controllers: [MdpsController],
  providers: [MdpsService],
})
export class MdpsModule {}
