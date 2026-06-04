import { SetMetadata } from '@nestjs/common';

export const SOFTWARE_ACCESS_KEY = 'software_id';
export const SoftwareAccess = (softwareId: string) =>
  SetMetadata(SOFTWARE_ACCESS_KEY, softwareId);
