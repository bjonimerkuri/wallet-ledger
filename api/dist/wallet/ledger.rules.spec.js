"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const ledger_rules_1 = require("./ledger.rules");
describe('assertCanTransfer', () => {
    it('allows a valid transfer', () => {
        expect(() => (0, ledger_rules_1.assertCanTransfer)('a', 'b', 1000, 500)).not.toThrow();
    });
    it('allows spending the full balance', () => {
        expect(() => (0, ledger_rules_1.assertCanTransfer)('a', 'b', 500, 500)).not.toThrow();
    });
    it('rejects insufficient funds', () => {
        expect(() => (0, ledger_rules_1.assertCanTransfer)('a', 'b', 100, 500)).toThrow(common_1.UnprocessableEntityException);
    });
    it('rejects transfers to the same account', () => {
        expect(() => (0, ledger_rules_1.assertCanTransfer)('a', 'a', 1000, 100)).toThrow(common_1.BadRequestException);
    });
    it.each([0, -5, 1.5])('rejects invalid amount %p', (amount) => {
        expect(() => (0, ledger_rules_1.assertCanTransfer)('a', 'b', 1000, amount)).toThrow(common_1.BadRequestException);
    });
});
