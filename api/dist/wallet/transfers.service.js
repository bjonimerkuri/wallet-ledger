"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("./account.entity");
const ledger_entry_entity_1 = require("./ledger-entry.entity");
const ledger_rules_1 = require("./ledger.rules");
const transfer_entity_1 = require("./transfer.entity");
let TransfersService = class TransfersService {
    constructor(ds, accounts, transfers) {
        this.ds = ds;
        this.accounts = accounts;
        this.transfers = transfers;
    }
    async accountOf(userId) {
        const { id, email, balance, currency } = await this.accounts.findOneByOrFail({ userId });
        return { id, email, balance, currency };
    }
    async create(userId, key, toEmail, amount) {
        const from = await this.accountOf(userId);
        try {
            return await this.ds.transaction(async (m) => {
                const existing = await m.findOneBy(transfer_entity_1.Transfer, { fromAccountId: from.id, idempotencyKey: key });
                if (existing)
                    return existing;
                const to = await m.findOne(account_entity_1.Account, { where: { email: toEmail } });
                if (!to)
                    throw new common_1.NotFoundException('Recipient not found');
                const locked = new Map();
                for (const id of [from.id, to.id].sort()) {
                    locked.set(id, await m.findOneOrFail(account_entity_1.Account, { where: { id }, lock: { mode: 'pessimistic_write' } }));
                }
                const src = locked.get(from.id);
                const dst = locked.get(to.id);
                (0, ledger_rules_1.assertCanTransfer)(src.id, dst.id, src.balance, amount);
                src.balance -= amount;
                dst.balance += amount;
                await m.save([src, dst]);
                const transfer = await m.save(m.create(transfer_entity_1.Transfer, {
                    fromAccountId: src.id,
                    toAccountId: dst.id,
                    toEmail: dst.email,
                    amount,
                    idempotencyKey: key,
                }));
                await m.save(ledger_entry_entity_1.LedgerEntry, [
                    { transferId: transfer.id, accountId: src.id, amount: -amount },
                    { transferId: transfer.id, accountId: dst.id, amount },
                ]);
                return transfer;
            });
        }
        catch (e) {
            if (e?.code === '23505') {
                return this.transfers.findOneByOrFail({ fromAccountId: from.id, idempotencyKey: key });
            }
            throw e;
        }
    }
    async history(userId, limit, before) {
        const acc = await this.accountOf(userId);
        const rows = await this.transfers.find({
            where: [
                { fromAccountId: acc.id, ...(before ? { createdAt: (0, typeorm_2.LessThan)(new Date(before)) } : {}) },
                { toAccountId: acc.id, ...(before ? { createdAt: (0, typeorm_2.LessThan)(new Date(before)) } : {}) },
            ],
            order: { createdAt: 'DESC' },
            take: limit + 1,
        });
        const hasMore = rows.length > limit;
        const items = rows.slice(0, limit).map((t) => ({
            id: t.id,
            amount: t.amount,
            currency: acc.currency,
            direction: (t.fromAccountId === acc.id ? 'sent' : 'received'),
            counterpartyEmail: t.fromAccountId === acc.id ? t.toEmail : '',
            createdAt: t.createdAt,
        }));
        return {
            items,
            nextCursor: hasMore && items.length ? items[items.length - 1].createdAt.toISOString() : null,
        };
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __param(2, (0, typeorm_1.InjectRepository)(transfer_entity_1.Transfer)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TransfersService);
