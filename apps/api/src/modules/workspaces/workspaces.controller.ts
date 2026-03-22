import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for current user' })
  getMyWorkspaces(@CurrentUser('sub') userId: string) {
    return this.workspaces.getUserWorkspaces(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new workspace' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.createWorkspace(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details' })
  getOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.workspaces.getWorkspace(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  update(@Param('id') id: string, @CurrentUser('sub') userId: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaces.updateWorkspace(id, userId, dto);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite team member' })
  invite(@Param('id') id: string, @CurrentUser('sub') userId: string, @Body() dto: InviteMemberDto) {
    return this.workspaces.inviteMember(id, userId, dto);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept workspace invitation' })
  acceptInvitation(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    return this.workspaces.acceptInvitation(token, userId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove team member' })
  removeMember(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspaces.removeMember(id, userId, memberId);
  }
}
