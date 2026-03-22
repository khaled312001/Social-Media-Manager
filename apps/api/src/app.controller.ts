import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  @Get()
  @ApiOperation({ summary: 'API info' })
  info() {
    return {
      name: 'Barmagly API',
      version: '1.0.0',
      docs: '/docs',
    };
  }
}
