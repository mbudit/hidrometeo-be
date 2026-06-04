import { Injectable } from '@nestjs/common';

@Injectable()
export class SamsService {
  getStatus() {
    return { service: 'SAMS', status: 'ok' };
  }
}
