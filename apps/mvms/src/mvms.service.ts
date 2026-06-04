import { Injectable } from '@nestjs/common';

@Injectable()
export class MvmsService {
  getStatus() {
    return { service: 'MVMS', status: 'ok' };
  }
}
