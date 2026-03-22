import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  return format(new Date(date), pattern);
}

export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy');
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    FACEBOOK: '#1877F2',
    INSTAGRAM: '#E4405F',
    TWITTER: '#000000',
    TIKTOK: '#010101',
    LINKEDIN: '#0A66C2',
    YOUTUBE: '#FF0000',
  };
  return colors[platform.toUpperCase()] ?? '#6366F1';
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    FACEBOOK: '📘',
    INSTAGRAM: '📸',
    TWITTER: '🐦',
    TIKTOK: '🎵',
    LINKEDIN: '💼',
    YOUTUBE: '▶️',
  };
  return icons[platform.toUpperCase()] ?? '🌐';
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
