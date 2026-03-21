export enum Platform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TWITTER = 'TWITTER',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN',
  YOUTUBE = 'YOUTUBE',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  [Platform.FACEBOOK]: 'Facebook',
  [Platform.INSTAGRAM]: 'Instagram',
  [Platform.TWITTER]: 'X (Twitter)',
  [Platform.TIKTOK]: 'TikTok',
  [Platform.LINKEDIN]: 'LinkedIn',
  [Platform.YOUTUBE]: 'YouTube',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.FACEBOOK]: '#1877F2',
  [Platform.INSTAGRAM]: '#E4405F',
  [Platform.TWITTER]: '#000000',
  [Platform.TIKTOK]: '#010101',
  [Platform.LINKEDIN]: '#0A66C2',
  [Platform.YOUTUBE]: '#FF0000',
};

export const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  [Platform.FACEBOOK]: 63206,
  [Platform.INSTAGRAM]: 2200,
  [Platform.TWITTER]: 280,
  [Platform.TIKTOK]: 2200,
  [Platform.LINKEDIN]: 3000,
  [Platform.YOUTUBE]: 5000,
};
