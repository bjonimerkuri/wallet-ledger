import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsInt, Min } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { TransfersService } from './transfers.service';

class CreateTransferDto {
  @IsEmail()
  toEmail: string;

  @IsInt()
  @Min(1)
  amount: number;
}

@Controller()
@UseGuards(JwtGuard)
export class WalletController {
  constructor(private readonly transfers: TransfersService) {}

  @Get('accounts/me')
  async me(@Req() req: any) {
    const { id, balance, currency } = await this.transfers.accountOf(req.user.sub);
    return { id, balance, currency };
  }

  @Post('transfers')
  create(
    @Req() req: any,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: CreateTransferDto,
  ) {
    if (!key) throw new BadRequestException('Idempotency-Key header is required');
    return this.transfers.create(req.user.sub, key, dto.toEmail, dto.amount);
  }

  @Get('transfers')
  history(@Req() req: any) {
    return this.transfers.history(req.user.sub);
  }
}
