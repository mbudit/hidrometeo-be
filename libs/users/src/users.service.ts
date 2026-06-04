import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      refresh_token_hash: refreshTokenHash,
    });
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: User['role'];
    software_access?: string[];
  }): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const user = this.usersRepository.create({
      email: data.email,
      password_hash,
      name: data.name,
      role: data.role,
      software_access: data.software_access ?? [],
    });

    return this.usersRepository.save(user);
  }
}
