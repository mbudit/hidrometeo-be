import { UserRole } from '@app/users';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  software_access: string[];
}
