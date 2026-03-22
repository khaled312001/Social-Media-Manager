export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MODERATOR = 'MODERATOR',
  ANALYST = 'ANALYST',
  MEMBER = 'MEMBER',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.OWNER]: 100,
  [Role.ADMIN]: 80,
  [Role.MANAGER]: 60,
  [Role.MODERATOR]: 40,
  [Role.ANALYST]: 20,
  [Role.MEMBER]: 10,
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.OWNER]: ['*'],
  [Role.ADMIN]: [
    'workspace:manage', 'members:manage', 'billing:manage',
    'posts:*', 'inbox:*', 'campaigns:*', 'analytics:*',
    'social-accounts:*', 'automations:*', 'api-keys:*',
  ],
  [Role.MANAGER]: [
    'posts:*', 'inbox:*', 'campaigns:*', 'analytics:read',
    'social-accounts:read', 'automations:manage',
  ],
  [Role.MODERATOR]: [
    'posts:create', 'posts:update', 'inbox:*', 'analytics:read',
  ],
  [Role.ANALYST]: [
    'analytics:*', 'posts:read', 'campaigns:read',
  ],
  [Role.MEMBER]: [
    'posts:read', 'inbox:read',
  ],
};
