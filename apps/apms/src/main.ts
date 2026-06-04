import { NestFactory } from '@nestjs/core';
import { ApmsModule } from './apms.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ApmsModule);
  await app.listen(3002);
  console.log('APMS service is running on port 3002');
}
void bootstrap();
