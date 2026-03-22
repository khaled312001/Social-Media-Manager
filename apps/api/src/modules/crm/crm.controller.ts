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
  CrmService,
  CreateContactDto,
  UpdateContactDto,
  ContactFilters,
  AddNoteDto,
  AddActivityDto,
} from './crm.service';
import { FunnelStage } from '@barmagly/shared';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('pipeline')
  @ApiOperation({ summary: 'Get the full CRM pipeline grouped by stage' })
  getPipeline(@WorkspaceId() workspaceId: string) {
    return this.crm.getPipeline(workspaceId);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'List contacts with optional filters' })
  @ApiQuery({ name: 'stage', enum: FunnelStage, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findAll(@WorkspaceId() workspaceId: string, @Query() filters: ContactFilters) {
    return this.crm.findAll(workspaceId, filters);
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Get contact with notes and activities' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.crm.findOne(workspaceId, id);
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Create a new CRM contact' })
  create(@WorkspaceId() workspaceId: string, @Body() dto: CreateContactDto) {
    return this.crm.createContact(workspaceId, dto);
  }

  @Patch('contacts/:id')
  @ApiOperation({ summary: 'Update a contact' })
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.crm.update(workspaceId, id, dto);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Delete a contact' })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.crm.delete(workspaceId, id);
  }

  @Post('contacts/:id/notes')
  @ApiOperation({ summary: 'Add a note to a contact' })
  addNote(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.crm.addNote(workspaceId, id, dto);
  }

  @Post('contacts/:id/activities')
  @ApiOperation({ summary: 'Log an activity for a contact' })
  addActivity(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: AddActivityDto,
  ) {
    return this.crm.addActivity(workspaceId, id, dto);
  }

  @Patch('contacts/:id/stage')
  @ApiOperation({ summary: 'Move a contact to a different funnel stage' })
  updateStage(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body('stage') stage: FunnelStage,
  ) {
    return this.crm.updateStage(workspaceId, id, stage);
  }
}
