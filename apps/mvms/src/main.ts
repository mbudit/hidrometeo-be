import { NestFactory } from '@nestjs/core';
import { MvmsModule } from './mvms.module.js';

async function bootstrap() {
  const app = await NestFactory.create(MvmsModule);
  await app.listen(3004);
  console.log('MVMS service is running on port 3004');
}
void bootstrap();
