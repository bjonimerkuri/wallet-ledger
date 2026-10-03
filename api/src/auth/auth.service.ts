import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Account } from '../wallet/account.entity';
import { User } from './user.entity';

const DEMO_FUNDS = 10_000; 

@Injectable()
export class AuthService {
  constructor(private readonly ds: DataSource, private readonly jwt: JwtService) {}

  async register(email: string, password: string) {
    if (await this.ds.getRepository(User).findOneBy({ email })) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.ds.transaction(async (m) => {
      const u = await m.save(m.create(User, { email, passwordHash }));
      await m.save(m.create(Account, { userId: u.id, balance: DEMO_FUNDS }));
      return u;
    });
    return this.token(user);
  }

  async login(email: string, password: string) {
    const user = await this.ds.getRepository(User).findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.token(user);
  }

  private token(user: User) {
    return { accessToken: this.jwt.sign({ sub: user.id, email: user.email }) };
  }
}
