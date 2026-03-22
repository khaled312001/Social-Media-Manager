import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { AiAgentsService } from './ai-agents.service';
import { ContentGenerationRequest, Platform } from '@barmagly/shared';

class GenerateContentDto implements ContentGenerationRequest {
  @IsString() topic: string;
  @IsArray() @IsEnum(Platform, { each: true }) platforms: Platform[];
  @IsString() tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
  @IsString() length: 'short' | 'medium' | 'long';
  includeHashtags: boolean = true;
  includeEmojis: boolean = true;
  @IsOptional() @IsString() brandVoice?: string;
  @IsOptional() @IsArray() keywords?: string[];
  @IsOptional() @IsString() targetAudience?: string;
}

class SuggestReplyDto {
  @IsString() messageContent: string;
  @IsString() authorName: string;
  @IsString() platform: string;
  @IsOptional() @IsString() brandVoice?: string;
}

class AnalyticsQueryDto {
  @IsString() query: string;
}

class TrendDetectionDto {
  @IsString() industry: string;
  @IsArray() platforms: string[];
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiAgentsController {
  constructor(private readonly ai: AiAgentsService) {}

  @Post('content/generate')
  @ApiOperation({ summary: 'Generate AI content for multiple platforms' })
  generateContent(@Body() dto: GenerateContentDto) {
    return this.ai.generateContent(dto);
  }

  @Post('reply/suggest')
  @ApiOperation({ summary: 'Suggest AI reply to inbox message' })
  suggestReply(@Body() dto: SuggestReplyDto) {
    return this.ai.suggestReply(dto.messageContent, dto.authorName, dto.platform, dto.brandVoice);
  }

  @Post('analytics/query')
  @ApiOperation({ summary: 'Ask AI about your analytics' })
  analyzePerformance(@WorkspaceId() workspaceId: string, @Body() dto: AnalyticsQueryDto) {
    return this.ai.analyzePerformance(workspaceId, dto.query);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get AI insight summary' })
  getInsightSummary(@WorkspaceId() workspaceId: string, @Query('period') period: '7d' | '30d' | '90d' = '30d') {
    return this.ai.analyzePerformance(workspaceId, `Summarize the last ${period} performance`);
  }

  @Post('trends')
  @ApiOperation({ summary: 'Detect trending topics' })
  detectTrends(@Body() dto: TrendDetectionDto) {
    return this.ai.detectTrends(dto.industry, dto.platforms);
  }

  @Post('support')
  @ApiOperation({ summary: 'AI customer support bot' })
  support(@Body() body: { message: string }) {
    return this.ai.handleSupportQuery(body.message);
  }
}
