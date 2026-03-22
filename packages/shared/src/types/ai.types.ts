import { Platform } from '../enums';

export interface ContentGenerationRequest {
  topic: string;
  platforms: Platform[];
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
  length: 'short' | 'medium' | 'long';
  includeHashtags: boolean;
  includeEmojis: boolean;
  brandVoice?: string;
  keywords?: string[];
  targetAudience?: string;
}

export interface GeneratedContent {
  platform: Platform;
  content: string;
  hashtags: string[];
  suggestedMediaPrompt?: string;
  estimatedEngagement?: 'low' | 'medium' | 'high';
  bestTimeToPost?: string;
}

export interface TrendingTopic {
  topic: string;
  volume: number;
  sentiment: number; // -1 to 1
  platforms: Platform[];
  relatedHashtags: string[];
  opportunityScore: number; // 0-100
}

export interface AIAgent {
  id: string;
  type: AIAgentType;
  name: string;
  description: string;
  isActive: boolean;
  configuration: Record<string, unknown>;
}

export enum AIAgentType {
  CONTENT_GENERATOR = 'CONTENT_GENERATOR',
  ENGAGEMENT = 'ENGAGEMENT',
  ANALYTICS = 'ANALYTICS',
  CAMPAIGN_OPTIMIZER = 'CAMPAIGN_OPTIMIZER',
  TREND_DETECTION = 'TREND_DETECTION',
  SUPPORT_BOT = 'SUPPORT_BOT',
}
