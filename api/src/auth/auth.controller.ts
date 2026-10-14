import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CredentialsDto } from './auth.dto';
import { AuthService } from './auth.service';

const TEST_THROTTLE = { default: { limit: 100_000, ttl: 60_000 } };
const authThrottle = (limit: number) =>
  process.env.NODE_ENV === 'test' ? TEST_THROTTLE : { default: { limit, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle(authThrottle(5))
  @ApiOperation({ summary: 'Create a user and wallet with demo funds' })
  register(@Body() dto: CredentialsDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('login')
  @Throttle(authThrottle(10))
  @ApiOperation({ summary: 'Exchange credentials for a JWT' })
  login(@Body() dto: CredentialsDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
