import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { Account } from './account.entity';
import { LedgerEntry } from './ledger-entry.entity';
import { Transfer } from './transfer.entity';
import { TransfersService } from './transfers.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, Transfer, LedgerEntry])],
  controllers: [WalletController],
  providers: [TransfersService],
})
export class WalletModule {}
