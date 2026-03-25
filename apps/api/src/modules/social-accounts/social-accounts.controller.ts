import { Controller, Get, Delete, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { SocialAccountsService } from './social-accounts.service';
import { Platform } from '@barmagly/shared';

@ApiTags('social-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly service: SocialAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List connected social accounts' })
  getAll(@WorkspaceId() workspaceId: string) {
    return this.service.getWorkspaceAccounts(workspaceId);
  }

  @Get('oauth-url')
  @ApiOperation({ summary: 'Get OAuth URL for platform (JSON, for popup flow)' })
  getOAuthUrlJson(@Query('platform') platform: Platform, @WorkspaceId() workspaceId: string) {
    const url = this.service.getOAuthUrl(platform, workspaceId);
    return { url };
  }

  @Get('connect/:platform')
  @ApiOperation({ summary: 'Get OAuth URL for platform (redirect)' })
  getOAuthUrl(@Param('platform') platform: Platform, @WorkspaceId() workspaceId: string, @Res() res: Response) {
    const url = this.service.getOAuthUrl(platform, workspaceId);
    return res.redirect(url);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect a social account' })
  disconnect(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.service.disconnectAccount(workspaceId, id);
  }
}
