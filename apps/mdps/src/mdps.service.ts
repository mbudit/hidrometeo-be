import { Injectable } from '@nestjs/common';

@Injectable()
export class MdpsService {
  getStatus() {
    return { service: 'MDPS', status: 'ok' };
  }
}
