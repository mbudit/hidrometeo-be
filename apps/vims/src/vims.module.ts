import { Module } from '@nestjs/common';
import { VimsController } from './vims.controller.js';
import { VimsService } from './vims.service.js';

@Module({
  imports: [],
  controllers: [VimsController],
  providers: [VimsService],
})
export class VimsModule {}
