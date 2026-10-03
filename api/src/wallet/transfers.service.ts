import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Account } from './account.entity';
import { LedgerEntry } from './ledger-entry.entity';
import { assertCanTransfer } from './ledger.rules';
import { Transfer } from './transfer.entity';

@Injectable()
export class TransfersService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
    @InjectRepository(Transfer) private readonly transfers: Repository<Transfer>,
  ) {}

  accountOf(userId: string) {
    return this.accounts.findOneByOrFail({ userId });
  }

  async create(userId: string, key: string, toEmail: string, amount: number) {
    const from = await this.accountOf(userId);

    const existing = await this.transfers.findOneBy({ fromAccountId: from.id, idempotencyKey: key });
    if (existing) return existing;

    try {
      return await this.ds.transaction(async (m) => {
        const toUser = await m.findOneBy(User, { email: toEmail });
        if (!toUser) throw new NotFoundException('Recipient not found');
        const to = await m.findOneByOrFail(Account, { userId: toUser.id });

        const locked = new Map<string, Account>();
        for (const id of [from.id, to.id].sort()) {
          locked.set(
            id,
            await m.findOneOrFail(Account, { where: { id }, lock: { mode: 'pessimistic_write' } }),
          );
        }
        const src = locked.get(from.id)!;
        const dst = locked.get(to.id)!;

        assertCanTransfer(src.id, dst.id, src.balance, amount);

        src.balance -= amount;
        dst.balance += amount;
        await m.save([src, dst]);

        const transfer = await m.save(
          m.create(Transfer, {
            fromAccountId: src.id,
            toAccountId: dst.id,
            amount,
            idempotencyKey: key,
          }),
        );
        await m.save(LedgerEntry, [
          { transferId: transfer.id, accountId: src.id, amount: -amount },
          { transferId: transfer.id, accountId: dst.id, amount },
        ]);
        return transfer;
      });
    } catch (e: any) {
      if (e?.code === '23505') {
        return this.transfers.findOneByOrFail({ fromAccountId: from.id, idempotencyKey: key });
      }
      throw e;
    }
  }

  async history(userId: string) {
    const acc = await this.accountOf(userId);
    const rows = await this.transfers.find({
      where: [{ fromAccountId: acc.id }, { toAccountId: acc.id }],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((t) => ({
      id: t.id,
      amount: t.amount,
      direction: t.fromAccountId === acc.id ? 'sent' : 'received',
      createdAt: t.createdAt,
    }));
  }
}
