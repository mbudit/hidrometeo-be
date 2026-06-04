import { Module } from '@nestjs/common';
import { MvmsController } from './mvms.controller.js';
import { MvmsService } from './mvms.service.js';

@Module({
  imports: [],
  controllers: [MvmsController],
  providers: [MvmsService],
})
export class MvmsModule {}
