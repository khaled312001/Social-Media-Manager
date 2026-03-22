import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { StorageService } from './storage.service';

class PresignedUrlDto {
  @IsString() fileName: string;
  @IsString() contentType: string;
  @IsString() folder?: string;
}

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned S3 upload URL' })
  getPresignedUrl(@WorkspaceId() workspaceId: string, @Body() dto: PresignedUrlDto) {
    return this.storage.getPresignedUploadUrl(workspaceId, dto.fileName, dto.contentType, dto.folder);
  }
}
