import { Injectable } from '@nestjs/common';

@Injectable()
export class AdsbmasService {
  getStatus() {
    return { service: 'ADSBMAS', status: 'ok' };
  }
}
