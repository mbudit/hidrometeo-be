import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@app/users';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.software_access,
    );
    const hash = await this.hashData(tokens.refresh_token);
    await this.usersService.updateRefreshToken(user.id, hash);

    return tokens;
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    if (!user.refresh_token_hash) {
      throw new UnauthorizedException('No active session');
    }

    const tokenValid = await bcrypt.compare(
      dto.refresh_token,
      user.refresh_token_hash,
    );

    if (!tokenValid) {
      // Possible token reuse — invalidate all sessions
      await this.usersService.updateRefreshToken(user.id, null);
      throw new UnauthorizedException('Refresh token revoked');
    }

    // Rotate: issue new pair and store new refresh hash
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.software_access,
    );
    const hash = await this.hashData(tokens.refresh_token);
    await this.usersService.updateRefreshToken(user.id, hash);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: JwtPayload['role'],
    softwareAccess: string[],
  ): Promise<TokenPair> {
    const payload: Record<string, unknown> = {
      sub: userId,
      email,
      role,
      software_access: softwareAccess,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }
}
