import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { InboxService } from './inbox.service';
import { InboxStatus } from '@barmagly/shared';

class ReplyDto { @IsString() content: string; }
class AssignDto { @IsString() assignedToId: string; }
class NoteDto { @IsString() content: string; }
class UpdateStatusDto { @IsEnum(InboxStatus) status: InboxStatus; }

@ApiTags('inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inbox')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get inbox stats' })
  stats(@WorkspaceId() workspaceId: string) {
    return this.inbox.getStats(workspaceId);
  }

  @Get()
  @ApiOperation({ summary: 'List inbox messages' })
  findAll(@WorkspaceId() workspaceId: string, @Query() query: any) {
    return this.inbox.findAll(workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message thread' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.inbox.findOne(workspaceId, id);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Send reply' })
  reply(@WorkspaceId() workspaceId: string, @Param('id') id: string, @CurrentUser('sub') userId: string, @Body() dto: ReplyDto) {
    return this.inbox.sendReply(workspaceId, id, userId, dto.content);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign message to team member' })
  assign(@WorkspaceId() workspaceId: string, @Param('id') id: string, @Body() dto: AssignDto) {
    return this.inbox.assign(workspaceId, id, dto.assignedToId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add internal note' })
  addNote(@WorkspaceId() workspaceId: string, @Param('id') id: string, @CurrentUser('sub') userId: string, @Body() dto: NoteDto) {
    return this.inbox.addInternalNote(workspaceId, id, userId, dto.content);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update message status' })
  updateStatus(@WorkspaceId() workspaceId: string, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.inbox.updateStatus(workspaceId, id, dto.status);
  }
}
