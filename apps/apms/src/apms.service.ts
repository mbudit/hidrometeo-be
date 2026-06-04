import { Injectable } from '@nestjs/common';

@Injectable()
export class ApmsService {
  getStatus() {
    return { service: 'APMS', status: 'ok' };
  }
}
