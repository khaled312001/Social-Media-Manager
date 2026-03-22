import { Platform } from '../enums';

export interface OverviewMetrics {
  totalFollowers: number;
  followersGrowth: number; // percentage
  totalEngagements: number;
  engagementRate: number;
  totalReach: number;
  totalImpressions: number;
  postsPublished: number;
  avgResponseTime: number;
}

export interface PlatformMetrics {
  platform: Platform;
  followers: number;
  followersGrowth: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  posts: number;
  topPost?: {
    id: string;
    content: string;
    engagementRate: number;
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
  platform?: Platform;
}

export interface CompetitorMetrics {
  name: string;
  platform: Platform;
  followers: number;
  engagementRate: number;
  postsPerWeek: number;
  estimatedReach: number;
}

export interface ReportConfig {
  title: string;
  dateRange: { from: Date; to: Date };
  platforms: Platform[];
  metrics: string[];
  format: 'pdf' | 'excel' | 'csv';
}
