import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Account } from './account.entity';
import { LedgerEntry } from './ledger-entry.entity';
import { assertCanTransfer } from './ledger.rules';
import { Transfer } from './transfer.entity';

export type HistoryPage = {
  items: {
    id: string;
    amount: number;
    direction: 'sent' | 'received';
    createdAt: Date;
  }[];
  nextCursor: string | null;
};

@Injectable()
export class TransfersService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
    @InjectRepository(Transfer) private readonly transfers: Repository<Transfer>,
  ) {}

  async accountOf(userId: string) {
    const { id, email, balance, currency } = await this.accounts.findOneByOrFail({ userId });
    return { id, email, balance, currency };
  }

  async create(userId: string, key: string, toEmail: string, amount: number) {
    const from = await this.accountOf(userId);

    try {
      return await this.ds.transaction(async (m) => {
        const existing = await m.findOneBy(Transfer, { fromAccountId: from.id, idempotencyKey: key });
        if (existing) return existing;

        const to = await m.findOne(Account, { where: { email: toEmail } });
        if (!to) throw new NotFoundException('Recipient not found');

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
            toEmail: dst.email,
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

  async history(userId: string, limit: number, before?: string): Promise<HistoryPage> {
    const acc = await this.accountOf(userId);
    const rows = await this.transfers.find({
      where: [
        { fromAccountId: acc.id, ...(before ? { createdAt: LessThan(new Date(before)) } : {}) },
        { toAccountId: acc.id, ...(before ? { createdAt: LessThan(new Date(before)) } : {}) },
      ],
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: acc.currency,
      direction: (t.fromAccountId === acc.id ? 'sent' : 'received') as 'sent' | 'received',
      counterpartyEmail: t.fromAccountId === acc.id ? t.toEmail : '',
      createdAt: t.createdAt,
    }));
    return {
      items,
      nextCursor: hasMore && items.length ? items[items.length - 1].createdAt.toISOString() : null,
    };
  }
}
