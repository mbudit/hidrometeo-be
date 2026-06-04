import { NestFactory } from '@nestjs/core';
import { AdsbmasModule } from './adsbmas.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AdsbmasModule);
  await app.listen(3005);
  console.log('ADSBMAS service is running on port 3005');
}
void bootstrap();
