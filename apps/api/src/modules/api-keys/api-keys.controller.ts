import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { ApiKeysService, GenerateApiKeyDto } from './api-keys.service';

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys for the workspace' })
  list(@WorkspaceId() workspaceId: string) {
    return this.apiKeys.list(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific API key' })
  @ApiParam({ name: 'id' })
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.apiKeys.getOne(workspaceId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Generate a new API key — the raw key is returned once and cannot be retrieved again',
  })
  generate(@WorkspaceId() workspaceId: string, @Body() dto: GenerateApiKeyDto) {
    return this.apiKeys.generate(workspaceId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  revoke(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.apiKeys.revoke(workspaceId, id);
  }
}
