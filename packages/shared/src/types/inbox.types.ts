import { Platform, MessageType, Sentiment, InboxStatus } from '../enums';

export interface InboxFilter {
  platform?: Platform[];
  status?: InboxStatus[];
  sentiment?: Sentiment[];
  type?: MessageType[];
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  search?: string;
}

export interface InboxStats {
  total: number;
  unread: number;
  assigned: number;
  resolved: number;
  avgResponseTime: number; // minutes
  slaBreaches: number;
}

export interface SuggestedReply {
  text: string;
  tone: 'professional' | 'friendly' | 'empathetic';
  confidence: number;
}
