import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import {
  WhiteLabelService,
  UpdateBrandingDto,
} from './white-label.service';

@ApiTags('white-label')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('white-label')
export class WhiteLabelController {
  constructor(private readonly whiteLabel: WhiteLabelService) {}

  @Get()
  @ApiOperation({ summary: 'Get white-label configuration for the workspace' })
  getConfig(@WorkspaceId() workspaceId: string) {
    return this.whiteLabel.getConfig(workspaceId);
  }

  @Patch('branding')
  @ApiOperation({ summary: 'Update branding settings (logo, colors, fonts, etc.)' })
  updateBranding(@WorkspaceId() workspaceId: string, @Body() dto: UpdateBrandingDto) {
    return this.whiteLabel.updateBranding(workspaceId, dto);
  }

  @Patch('domain')
  @ApiOperation({ summary: 'Set a custom domain for the workspace' })
  setCustomDomain(
    @WorkspaceId() workspaceId: string,
    @Body('domain') domain: string,
  ) {
    return this.whiteLabel.setCustomDomain(workspaceId, domain);
  }

  @Post('domain/verify')
  @ApiOperation({ summary: 'Trigger custom domain DNS verification' })
  verifyDomain(@WorkspaceId() workspaceId: string) {
    return this.whiteLabel.verifyCustomDomain(workspaceId);
  }

  @Get('resolve/:domain')
  @ApiOperation({ summary: 'Resolve white-label config by custom domain (public endpoint)' })
  @ApiParam({ name: 'domain' })
  resolveByDomain(@Param('domain') domain: string) {
    return this.whiteLabel.resolveByDomain(domain);
  }
}
