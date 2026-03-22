import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts' })
  findAll(@WorkspaceId() workspaceId: string, @Query() query: PaginationDto & { status?: string; platform?: string }) {
    return this.posts.findAll(workspaceId, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get posts for calendar view' })
  calendar(@WorkspaceId() workspaceId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.posts.getCalendar(workspaceId, new Date(from), new Date(to));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post details' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.posts.findOne(workspaceId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create post' })
  create(@WorkspaceId() workspaceId: string, @CurrentUser('sub') userId: string, @Body() dto: CreatePostDto) {
    return this.posts.create(workspaceId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update post' })
  update(@WorkspaceId() workspaceId: string, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.posts.update(workspaceId, id, dto);
  }

  @Post(':id/publish-now')
  @ApiOperation({ summary: 'Publish post immediately' })
  publishNow(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.posts.publishNow(workspaceId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete post' })
  delete(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.posts.delete(workspaceId, id);
  }
}
