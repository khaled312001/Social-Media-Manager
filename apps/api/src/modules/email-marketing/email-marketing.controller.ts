import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import {
  EmailMarketingService,
  CreateListDto,
  AddSubscriberDto,
  CreateEmailCampaignDto,
  CreateAutomationDto,
} from './email-marketing.service';

@ApiTags('email-marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-marketing')
export class EmailMarketingController {
  constructor(private readonly emailMarketing: EmailMarketingService) {}

  // ─── Stats ────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get email marketing statistics' })
  getStats(@WorkspaceId() workspaceId: string) {
    return this.emailMarketing.getStats(workspaceId);
  }

  // ─── Lists ────────────────────────────────────────────────────────────────

  @Get('lists')
  @ApiOperation({ summary: 'List all email lists' })
  getLists(@WorkspaceId() workspaceId: string) {
    return this.emailMarketing.getLists(workspaceId);
  }

  @Post('lists')
  @ApiOperation({ summary: 'Create a new email list' })
  createList(@WorkspaceId() workspaceId: string, @Body() dto: CreateListDto) {
    return this.emailMarketing.createList(workspaceId, dto);
  }

  @Get('lists/:id')
  @ApiOperation({ summary: 'Get a single email list' })
  getList(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.emailMarketing.getList(workspaceId, id);
  }

  // ─── Subscribers ──────────────────────────────────────────────────────────

  @Get('lists/:id/subscribers')
  @ApiOperation({ summary: 'Get subscribers for a list' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSubscribers(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.emailMarketing.getSubscribers(workspaceId, id, page, limit);
  }

  @Post('lists/:id/subscribers')
  @ApiOperation({ summary: 'Add a subscriber to a list' })
  addSubscriber(
    @WorkspaceId() workspaceId: string,
    @Param('id') listId: string,
    @Body() dto: AddSubscriberDto,
  ) {
    return this.emailMarketing.addSubscriber(workspaceId, listId, dto);
  }

  @Delete('lists/:id/subscribers/:email')
  @ApiOperation({ summary: 'Unsubscribe an email from a list' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSubscriber(
    @WorkspaceId() workspaceId: string,
    @Param('id') listId: string,
    @Param('email') email: string,
  ) {
    return this.emailMarketing.removeSubscriber(workspaceId, listId, email);
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────

  @Get('campaigns')
  @ApiOperation({ summary: 'List all email campaigns' })
  getCampaigns(@WorkspaceId() workspaceId: string) {
    return this.emailMarketing.getCampaigns(workspaceId);
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a new email campaign' })
  createCampaign(@WorkspaceId() workspaceId: string, @Body() dto: CreateEmailCampaignDto) {
    return this.emailMarketing.createCampaign(workspaceId, dto);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get email campaign details' })
  getCampaign(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.emailMarketing.getCampaign(workspaceId, id);
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send or schedule an email campaign' })
  sendCampaign(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.emailMarketing.sendCampaign(workspaceId, id);
  }

  // ─── Automations ──────────────────────────────────────────────────────────

  @Get('automations')
  @ApiOperation({ summary: 'List all email automations' })
  getAutomations(@WorkspaceId() workspaceId: string) {
    return this.emailMarketing.getAutomations(workspaceId);
  }

  @Post('automations')
  @ApiOperation({ summary: 'Create an email automation' })
  createAutomation(@WorkspaceId() workspaceId: string, @Body() dto: CreateAutomationDto) {
    return this.emailMarketing.createAutomation(workspaceId, dto);
  }

  @Patch('automations/:id')
  @ApiOperation({ summary: 'Update an email automation' })
  updateAutomation(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAutomationDto>,
  ) {
    return this.emailMarketing.updateAutomation(workspaceId, id, dto);
  }

  @Delete('automations/:id')
  @ApiOperation({ summary: 'Delete an email automation' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAutomation(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.emailMarketing.deleteAutomation(workspaceId, id);
  }
}
