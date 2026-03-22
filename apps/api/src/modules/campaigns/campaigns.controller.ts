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
  CampaignsService,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignFilters,
} from './campaigns.service';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List all campaigns' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@WorkspaceId() workspaceId: string, @Query() filters: CampaignFilters) {
    return this.campaigns.findAll(workspaceId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details with posts' })
  @ApiParam({ name: 'id' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.campaigns.findOne(workspaceId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(@WorkspaceId() workspaceId: string, @Body() dto: CreateCampaignDto) {
    return this.campaigns.create(workspaceId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiParam({ name: 'id' })
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaigns.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.campaigns.delete(workspaceId, id);
  }

  @Post(':id/posts/:postId')
  @ApiOperation({ summary: 'Add a post to campaign' })
  addPost(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Param('postId') postId: string,
  ) {
    return this.campaigns.addPostToCampaign(workspaceId, id, postId);
  }

  @Delete(':id/posts/:postId')
  @ApiOperation({ summary: 'Remove a post from campaign' })
  removePost(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Param('postId') postId: string,
  ) {
    return this.campaigns.removePostFromCampaign(workspaceId, id, postId);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get aggregated analytics for a campaign' })
  getAnalytics(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.campaigns.getCampaignAnalytics(workspaceId, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Schedule all draft posts in a campaign for publishing' })
  publishAll(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.campaigns.publishAllCampaignPosts(workspaceId, id);
  }
}
