export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
  UNPAID = 'UNPAID',
}

export enum PlanSlug {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}
