import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtGuard } from '../auth/jwt.guard';
import { CreateTransferDto, HistoryQueryDto } from './dtos';
import { TransfersService } from './transfers.service';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtGuard)
export class WalletController {
  constructor(private readonly transfers: TransfersService) {}

  @Get('accounts/me')
  @ApiOperation({ summary: 'Current user account balance' })
  me(@Req() req: AuthenticatedRequest) {
    return this.transfers.accountOf(req.user.sub);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Send money; safe to retry with the same Idempotency-Key' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Client-generated unique key (e.g. UUID). Replays return the original transfer.',
  })
  create(
    @Req() req: AuthenticatedRequest,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: CreateTransferDto,
  ) {
    if (!key) throw new BadRequestException('Idempotency-Key header is required');
    return this.transfers.create(req.user.sub, key, dto.toEmail, dto.amount);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Paginated transfer history (cursor-based)' })
  history(@Req() req: AuthenticatedRequest, @Query() query: HistoryQueryDto) {
    return this.transfers.history(req.user.sub, query.limit ?? 50, query.before);
  }
}
