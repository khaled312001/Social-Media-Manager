export const APP_NAME = 'Barmagly';
export const APP_VERSION = '1.0.0';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const JWT_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '30d';

export const MAX_FILE_SIZE_MB = 100;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/avi'];

export const SLA_RESPONSE_TIME_HOURS = 24;

export const QUEUE_NAMES = {
  POST_SCHEDULER: 'post-scheduler',
  INBOX_SYNC: 'inbox-sync',
  ANALYTICS_SYNC: 'analytics-sync',
  EMAIL_SEND: 'email-send',
  WEBHOOK_DELIVER: 'webhook-deliver',
  AUTOMATION_EXECUTE: 'automation-execute',
  AI_PROCESS: 'ai-process',
} as const;

export const CACHE_TTL = {
  WORKSPACE: 300,       // 5 minutes
  USER: 300,            // 5 minutes
  ANALYTICS: 900,       // 15 minutes
  SOCIAL_ACCOUNT: 600,  // 10 minutes
  PLAN: 3600,           // 1 hour
} as const;

export const PLAN_LIMITS = {
  free: {
    socialAccounts: 3,
    postsPerMonth: 30,
    teamMembers: 1,
    workspaces: 1,
    emailSubscribers: 500,
    apiCalls: 1000,
  },
  starter: {
    socialAccounts: 10,
    postsPerMonth: 100,
    teamMembers: 3,
    workspaces: 3,
    emailSubscribers: 5000,
    apiCalls: 10000,
  },
  professional: {
    socialAccounts: 25,
    postsPerMonth: 500,
    teamMembers: 10,
    workspaces: 10,
    emailSubscribers: 25000,
    apiCalls: 100000,
  },
  business: {
    socialAccounts: 100,
    postsPerMonth: 2000,
    teamMembers: 50,
    workspaces: 50,
    emailSubscribers: 100000,
    apiCalls: 1000000,
  },
  enterprise: {
    socialAccounts: -1, // unlimited
    postsPerMonth: -1,
    teamMembers: -1,
    workspaces: -1,
    emailSubscribers: -1,
    apiCalls: -1,
  },
} as const;
