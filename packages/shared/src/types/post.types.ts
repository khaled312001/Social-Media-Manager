import { Platform, PostStatus, MediaType } from '../enums';

export interface PostMedia {
  url: string;
  type: MediaType;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
}

export interface PostPlatformConfig {
  platform: Platform;
  content?: string; // override content per platform
  firstComment?: string;
  locationId?: string;
  targetingOptions?: Record<string, unknown>;
}

export interface ScheduledPostJob {
  postId: string;
  workspaceId: string;
  platforms: Platform[];
  scheduledAt: Date;
  retryCount: number;
}

export interface PostAnalyticsData {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
  saves: number;
  engagementRate: number;
  updatedAt: Date;
}
