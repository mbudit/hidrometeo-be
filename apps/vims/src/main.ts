import { NestFactory } from '@nestjs/core';
import { VimsModule } from './vims.module.js';

async function bootstrap() {
  const app = await NestFactory.create(VimsModule);
  await app.listen(3007);
  console.log('VIMS service is running on port 3007');
}
void bootstrap();
