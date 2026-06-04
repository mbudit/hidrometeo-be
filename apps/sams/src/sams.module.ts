import { Module } from '@nestjs/common';
import { SamsController } from './sams.controller.js';
import { SamsService } from './sams.service.js';

@Module({
  imports: [],
  controllers: [SamsController],
  providers: [SamsService],
})
export class SamsModule {}
