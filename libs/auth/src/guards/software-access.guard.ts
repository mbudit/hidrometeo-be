import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@app/users';
import { SOFTWARE_ACCESS_KEY } from '../decorators/software-access.decorator.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class SoftwareAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const softwareId = this.reflector.getAllAndOverride<string>(
      SOFTWARE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No software ID restriction configured — allow access
    if (!softwareId) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Superadmin bypasses software access check
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    if (
      !user.software_access ||
      !user.software_access.includes(softwareId)
    ) {
      throw new ForbiddenException(
        `User does not have access to software '${softwareId}'`,
      );
    }

    return true;
  }
}
