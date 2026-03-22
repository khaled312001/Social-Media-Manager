import { Role } from '../enums';

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
}

export interface WorkspaceLimits {
  socialAccounts: number;
  postsPerMonth: number;
  teamMembers: number;
  workspaces: number;
  emailSubscribers: number;
  apiCalls: number;
}

export interface WorkspaceBranding {
  primaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
}
