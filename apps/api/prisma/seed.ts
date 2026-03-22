import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Plans ────────────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'free' },
      update: {},
      create: {
        name: 'Free',
        slug: 'free',
        description: 'Get started with social media management',
        priceMonthly: 0,
        priceYearly: 0,
        features: ['3 social accounts', '30 posts/month', '1 team member', 'Basic analytics'],
        limits: { socialAccounts: 3, postsPerMonth: 30, teamMembers: 1, workspaces: 1, emailSubscribers: 500, apiCalls: 1000 },
        sortOrder: 1,
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'starter' },
      update: {},
      create: {
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for small businesses',
        priceMonthly: 29,
        priceYearly: 290,
        features: ['10 social accounts', '100 posts/month', '3 team members', 'AI content generation', 'Email marketing'],
        limits: { socialAccounts: 10, postsPerMonth: 100, teamMembers: 3, workspaces: 3, emailSubscribers: 5000, apiCalls: 10000 },
        sortOrder: 2,
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'professional' },
      update: {},
      create: {
        name: 'Professional',
        slug: 'professional',
        description: 'For growing businesses & agencies',
        priceMonthly: 79,
        priceYearly: 790,
        features: ['25 social accounts', '500 posts/month', '10 team members', 'All AI features', 'CRM', 'Advanced analytics'],
        limits: { socialAccounts: 25, postsPerMonth: 500, teamMembers: 10, workspaces: 10, emailSubscribers: 25000, apiCalls: 100000 },
        isPopular: true,
        sortOrder: 3,
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'business' },
      update: {},
      create: {
        name: 'Business',
        slug: 'business',
        description: 'For large teams & agencies',
        priceMonthly: 199,
        priceYearly: 1990,
        features: ['100 social accounts', '2000 posts/month', '50 team members', 'White label', 'API access', 'Priority support'],
        limits: { socialAccounts: 100, postsPerMonth: 2000, teamMembers: 50, workspaces: 50, emailSubscribers: 100000, apiCalls: 1000000 },
        sortOrder: 4,
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Unlimited everything + dedicated support',
        priceMonthly: 499,
        priceYearly: 4990,
        features: ['Unlimited everything', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'SSO'],
        limits: { socialAccounts: -1, postsPerMonth: -1, teamMembers: -1, workspaces: -1, emailSubscribers: -1, apiCalls: -1 },
        sortOrder: 5,
      },
    }),
  ]);
  console.log(`✅ Created ${plans.length} plans`);

  // ─── Demo User & Workspace ────────────────────────────────────
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@barmagly.com' },
    update: {},
    create: {
      email: 'demo@barmagly.com',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('Demo@123456', 12),
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Created demo user: ${demoUser.email}`);

  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      members: {
        create: {
          userId: demoUser.id,
          role: 'OWNER',
        },
      },
    },
  });
  console.log(`✅ Created demo workspace: ${demoWorkspace.name}`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
