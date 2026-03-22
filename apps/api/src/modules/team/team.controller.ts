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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  TeamService,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
} from './team.service';

@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get('tasks/board')
  @ApiOperation({ summary: 'Get tasks grouped by status (Kanban board view)' })
  getBoardView(@WorkspaceId() workspaceId: string) {
    return this.team.getBoardView(workspaceId);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks with filters' })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findTasks(@WorkspaceId() workspaceId: string, @Query() filters: TaskFilters) {
    return this.team.findTasks(workspaceId, filters);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task details with comments' })
  @ApiParam({ name: 'id' })
  findOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.team.findOne(workspaceId, id);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task' })
  createTask(@WorkspaceId() workspaceId: string, @Body() dto: CreateTaskDto) {
    return this.team.createTask(workspaceId, dto);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id' })
  updateTask(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.team.updateTask(workspaceId, id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.team.deleteTask(workspaceId, id);
  }

  @Post('tasks/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'id' })
  addComment(
    @WorkspaceId() workspaceId: string,
    @Param('id') taskId: string,
    @CurrentUser('sub') authorId: string,
    @Body('content') content: string,
  ) {
    return this.team.addComment(workspaceId, taskId, authorId, content);
  }
}
