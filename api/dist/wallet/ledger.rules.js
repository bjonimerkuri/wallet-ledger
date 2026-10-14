"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCanTransfer = assertCanTransfer;
const common_1 = require("@nestjs/common");
function assertCanTransfer(fromId, toId, balance, amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new common_1.BadRequestException('Amount must be a positive integer (minor units)');
    }
    if (fromId === toId) {
        throw new common_1.BadRequestException('Cannot transfer to yourself');
    }
    if (balance < amount) {
        throw new common_1.UnprocessableEntityException('Insufficient funds');
    }
}
