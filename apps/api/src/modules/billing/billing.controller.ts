import { Controller, Get, Post, Body, Param, Headers, RawBodyRequest, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { BillingService } from './billing.service';
import { Public } from '../../common/decorators/workspace.decorator';

class CheckoutDto {
  @IsString() planSlug: string;
  @IsIn(['monthly', 'yearly']) interval: 'monthly' | 'yearly';
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available plans' })
  @Public()
  getPlans() {
    return this.billing.getPlans();
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription' })
  getSubscription(@WorkspaceId() workspaceId: string) {
    return this.billing.getSubscription(workspaceId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  checkout(@WorkspaceId() workspaceId: string, @CurrentUser('sub') userId: string, @Body() dto: CheckoutDto) {
    return this.billing.createCheckoutSession(workspaceId, userId, dto.planSlug, dto.interval);
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  portal(@WorkspaceId() workspaceId: string) {
    return this.billing.createPortalSession(workspaceId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    return this.billing.handleWebhook(req.rawBody!, sig);
  }
}
