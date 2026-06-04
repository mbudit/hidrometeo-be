import { Injectable } from '@nestjs/common';

@Injectable()
export class WsdasService {
  getStatus() {
    return { service: 'WSDAS', status: 'ok' };
  }
}
