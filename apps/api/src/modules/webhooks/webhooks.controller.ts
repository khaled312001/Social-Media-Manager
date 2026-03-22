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
  WebhooksService,
  RegisterWebhookDto,
  WebhookFilters,
} from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List registered webhooks' })
  @ApiQuery({ name: 'event', required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  list(@WorkspaceId() workspaceId: string, @Query() filters: WebhookFilters) {
    return this.webhooks.list(workspaceId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiParam({ name: 'id' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.webhooks.findOne(workspaceId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new webhook endpoint' })
  register(@WorkspaceId() workspaceId: string, @Body() dto: RegisterWebhookDto) {
    return this.webhooks.register(workspaceId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiParam({ name: 'id' })
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<RegisterWebhookDto> & { active?: boolean },
  ) {
    return this.webhooks.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.webhooks.delete(workspaceId, id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get delivery logs for a webhook' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getDeliveries(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.webhooks.getDeliveryLogs(workspaceId, id, page, limit);
  }
}
