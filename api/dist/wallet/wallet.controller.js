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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const dtos_1 = require("./dtos");
const transfers_service_1 = require("./transfers.service");
let WalletController = class WalletController {
    constructor(transfers) {
        this.transfers = transfers;
    }
    me(req) {
        return this.transfers.accountOf(req.user.sub);
    }
    create(req, key, dto) {
        if (!key)
            throw new common_1.BadRequestException('Idempotency-Key header is required');
        return this.transfers.create(req.user.sub, key, dto.toEmail, dto.amount);
    }
    history(req, query) {
        return this.transfers.history(req.user.sub, query.limit ?? 50, query.before);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('accounts/me'),
    (0, swagger_1.ApiOperation)({ summary: 'Current user account balance' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('transfers'),
    (0, swagger_1.ApiOperation)({ summary: 'Send money; safe to retry with the same Idempotency-Key' }),
    (0, swagger_1.ApiHeader)({
        name: 'Idempotency-Key',
        description: 'Client-generated unique key (e.g. UUID). Replays return the original transfer.',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('idempotency-key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, dtos_1.CreateTransferDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('transfers'),
    (0, swagger_1.ApiOperation)({ summary: 'Paginated transfer history (cursor-based)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.HistoryQueryDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "history", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [transfers_service_1.TransfersService])
], WalletController);
