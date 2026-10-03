import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../wallet/account.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
