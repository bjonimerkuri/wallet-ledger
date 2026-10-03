import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { assertCanTransfer } from './ledger.rules';

describe('assertCanTransfer', () => {
  it('allows a valid transfer', () => {
    expect(() => assertCanTransfer('a', 'b', 1000, 500)).not.toThrow();
  });

  it('allows spending the full balance', () => {
    expect(() => assertCanTransfer('a', 'b', 500, 500)).not.toThrow();
  });

  it('rejects insufficient funds', () => {
    expect(() => assertCanTransfer('a', 'b', 100, 500)).toThrow(UnprocessableEntityException);
  });

  it('rejects transfers to the same account', () => {
    expect(() => assertCanTransfer('a', 'a', 1000, 100)).toThrow(BadRequestException);
  });

  it.each([0, -5, 1.5])('rejects invalid amount %p', (amount) => {
    expect(() => assertCanTransfer('a', 'b', 1000, amount)).toThrow(BadRequestException);
  });
});
