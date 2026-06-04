import { Module } from '@nestjs/common';
import { ApmsController } from './apms.controller.js';
import { ApmsService } from './apms.service.js';

@Module({
  imports: [],
  controllers: [ApmsController],
  providers: [ApmsService],
})
export class ApmsModule {}
