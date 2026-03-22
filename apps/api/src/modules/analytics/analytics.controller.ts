import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { AnalyticsService, ExportReportConfig } from './analytics.service';
import { Platform } from '@barmagly/shared';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview for a workspace' })
  @ApiQuery({ name: 'from', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2025-01-31' })
  getOverview(
    @WorkspaceId() workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateTo = to ? new Date(to) : new Date();
    const dateFrom = from
      ? new Date(from)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analytics.getOverview(workspaceId, dateFrom, dateTo);
  }

  @Get('platforms/:platform')
  @ApiOperation({ summary: 'Get analytics breakdown for a specific platform' })
  @ApiParam({ name: 'platform', enum: Platform })
  getPlatformBreakdown(
    @WorkspaceId() workspaceId: string,
    @Param('platform') platform: Platform,
  ) {
    return this.analytics.getPlatformBreakdown(workspaceId, platform);
  }

  @Get('posts/top')
  @ApiOperation({ summary: 'Get top performing posts' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopPosts(
    @WorkspaceId() workspaceId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.analytics.getTopPosts(workspaceId, limit);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get engagement time-series data' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTimeSeries(
    @WorkspaceId() workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateTo = to ? new Date(to) : new Date();
    const dateFrom = from
      ? new Date(from)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analytics.getEngagementTimeSeries(workspaceId, dateFrom, dateTo);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export analytics report (PDF/CSV/XLSX)' })
  exportReport(
    @WorkspaceId() workspaceId: string,
    @Body() config: ExportReportConfig,
  ) {
    return this.analytics.exportReport(workspaceId, config);
  }
}
