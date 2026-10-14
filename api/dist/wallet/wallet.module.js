"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../auth/user.entity");
const account_entity_1 = require("./account.entity");
const ledger_entry_entity_1 = require("./ledger-entry.entity");
const transfer_entity_1 = require("./transfer.entity");
const transfers_service_1 = require("./transfers.service");
const wallet_controller_1 = require("./wallet.controller");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, account_entity_1.Account, transfer_entity_1.Transfer, ledger_entry_entity_1.LedgerEntry])],
        controllers: [wallet_controller_1.WalletController],
        providers: [transfers_service_1.TransfersService],
    })
], WalletModule);
