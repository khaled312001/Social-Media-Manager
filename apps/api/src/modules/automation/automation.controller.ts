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
  AutomationService,
  CreateAutomationDto,
  UpdateAutomationDto,
  AutomationFilters,
} from './automation.service';
import { AutomationStatus, AutomationTriggerType } from '@barmagly/shared';

@ApiTags('automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automation')
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Get()
  @ApiOperation({ summary: 'List all automations' })
  @ApiQuery({ name: 'status', enum: AutomationStatus, required: false })
  @ApiQuery({ name: 'triggerType', enum: AutomationTriggerType, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findAll(@WorkspaceId() workspaceId: string, @Query() filters: AutomationFilters) {
    return this.automation.findAll(workspaceId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation details' })
  @ApiParam({ name: 'id' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.automation.findOne(workspaceId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new automation' })
  create(@WorkspaceId() workspaceId: string, @Body() dto: CreateAutomationDto) {
    return this.automation.create(workspaceId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an automation' })
  @ApiParam({ name: 'id' })
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto,
  ) {
    return this.automation.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an automation' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.automation.delete(workspaceId, id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle automation active/inactive' })
  @ApiParam({ name: 'id' })
  toggle(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.automation.toggle(workspaceId, id);
  }
}
