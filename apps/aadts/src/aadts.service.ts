import { Injectable } from '@nestjs/common';

@Injectable()
export class AadtsService {
  getStatus() {
    return { service: 'AADTS', status: 'ok' };
  }
}
