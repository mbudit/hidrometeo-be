import { NestFactory } from '@nestjs/core';
import { WsdasModule } from './wsdas.module.js';

async function bootstrap() {
  const app = await NestFactory.create(WsdasModule);
  await app.listen(3006);
  console.log('WSDAS service is running on port 3006');
}
void bootstrap();
