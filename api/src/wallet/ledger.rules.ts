import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';

/** Pure business rules, kept separate so they are easy to unit test. */
export function assertCanTransfer(
  fromId: string,
  toId: string,
  balance: number,
  amount: number,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new BadRequestException('Amount must be a positive integer (minor units)');
  }
  if (fromId === toId) {
    throw new BadRequestException('Cannot transfer to yourself');
  }
  if (balance < amount) {
    throw new UnprocessableEntityException('Insufficient funds');
  }
}
