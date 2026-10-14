import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Liveness and database connectivity check' })
  async check() {
    try {
      await this.ds.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch {
      return { status: 'degraded', db: 'down' };
    }
  }
}
