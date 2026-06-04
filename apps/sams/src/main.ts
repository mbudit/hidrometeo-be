import { NestFactory } from '@nestjs/core';
import { SamsModule } from './sams.module.js';

async function bootstrap() {
  const app = await NestFactory.create(SamsModule);
  await app.listen(3003);
  console.log('SAMS service is running on port 3003');
}
void bootstrap();
