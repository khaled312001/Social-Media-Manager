import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getSubscription(workspaceId: string) {
    return this.prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });
  }

  async createCheckoutSession(workspaceId: string, userId: string, planSlug: string, interval: 'monthly' | 'yearly') {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new NotFoundException('Plan not found');

    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const customer = await this.stripe.customers.create({
        email: user?.email,
        name: workspace.name,
        metadata: { workspaceId },
      });
      customerId = customer.id;
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customer.id },
      });
    }

    const priceId = interval === 'yearly'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;

    if (!priceId) throw new BadRequestException(`No Stripe price configured for ${planSlug} (${interval})`);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('FRONTEND_URL')}/dashboard/settings/billing?success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/dashboard/settings/billing?cancelled=true`,
      metadata: { workspaceId, planSlug, interval },
      subscription_data: { metadata: { workspaceId } },
      allow_promotion_codes: true,
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace?.stripeCustomerId) throw new BadRequestException('No Stripe customer found');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${this.config.get('FRONTEND_URL')}/dashboard/settings/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      throw new BadRequestException(`Webhook error: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object as Stripe.Subscription);
        break;
    }

    return { received: true };
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    const workspaceId = subscription.metadata?.workspaceId;
    if (!workspaceId) return;

    const planSlug = subscription.metadata?.planSlug;
    const plan = planSlug ? await this.prisma.plan.findUnique({ where: { slug: planSlug } }) : null;

    if (!plan) {
      this.logger.warn(`No plan found for subscription ${subscription.id}`);
      return;
    }

    await this.prisma.subscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        status: subscription.status.toUpperCase() as any,
        interval: subscription.metadata?.interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      },
      update: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    this.logger.log(`Synced subscription ${subscription.id} for workspace ${workspaceId}`);
  }

  private async cancelSubscription(subscription: Stripe.Subscription) {
    const workspaceId = subscription.metadata?.workspaceId;
    if (!workspaceId) return;

    await this.prisma.subscription.updateMany({
      where: { workspaceId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}
