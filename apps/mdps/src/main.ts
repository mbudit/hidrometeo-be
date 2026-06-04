import { NestFactory } from '@nestjs/core';
import { MdpsModule } from './mdps.module.js';

async function bootstrap() {
  const app = await NestFactory.create(MdpsModule);
  await app.listen(3008);
  console.log('MDPS service is running on port 3008');
}
void bootstrap();
