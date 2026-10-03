import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/wallet',
      autoLoadEntities: true,
      synchronize: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule,
    WalletModule,
  ],
})
export class AppModule {}
