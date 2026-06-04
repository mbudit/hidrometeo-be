import { Module } from '@nestjs/common';
import { AadtsController } from './aadts.controller.js';
import { AadtsService } from './aadts.service.js';

@Module({
  imports: [],
  controllers: [AadtsController],
  providers: [AadtsService],
})
export class AadtsModule {}
