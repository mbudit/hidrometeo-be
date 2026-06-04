import { NestFactory } from '@nestjs/core';
import { AadtsModule } from './aadts.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AadtsModule);
  await app.listen(3001);
  console.log('AADTS service is running on port 3001');
}
void bootstrap();
