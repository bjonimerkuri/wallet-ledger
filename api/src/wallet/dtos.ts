import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEmail, IsInt, IsISO8601, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ example: 'friend@example.com' })
  @IsEmail()
  toEmail: string;

  @ApiProperty({
    example: 1050,
    description: 'Amount in minor units (cents). Integers only — never floats.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amount: number;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 200 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({
    example: '2026-10-14T12:00:00.000Z',
    description: 'ISO timestamp cursor; returns transfers strictly older than this.',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsISO8601()
  before?: string;
}
