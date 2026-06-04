import { Injectable } from '@nestjs/common';

@Injectable()
export class VimsService {
  getStatus() {
    return { service: 'VIMS', status: 'ok' };
  }
}
