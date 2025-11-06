// Application constants and limits

export const CATEGORIES = [
  'education',
  'business',
  'technology',
  'health',
  'sports',
  'entertainment',
  'science',
  'politics'
] as const;

export const LIMITS = {
  // Pagination
  POSTS_PER_PAGE: 10,
  
  // User limits
  PIN_MAX_PER_30_DAYS: 3,
  
  // Content limits
  POST_TITLE_MAX_LENGTH: 200,
  POST_CONTENT_MAX_LENGTH: 10000,
  COMMENT_MAX_LENGTH: 1000,
  BIO_MAX_LENGTH: 500,
  
  // File upload limits
  IMAGE_MAX_SIZE_MB: 1,
  IMAGE_MAX_COUNT: 3,
  IMAGE_MIN_DIMENSION: 200,
  IMAGE_MAX_DIMENSION: 4000,
  
  // Username/Display name limits
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  DISPLAY_NAME_MAX_LENGTH: 100,
} as const;

// Rate limit configurations (for reference/documentation)
export const RATE_LIMIT_CONFIG = {
  comment: { limit: 10, window: 60 }, // 10 per minute
  like: { limit: 30, window: 60 }, // 30 per minute
  post: { limit: 5, window: 3600 }, // 5 per hour (admins bypass)
  search: { limit: 60, window: 60 }, // 60 per minute
  report: { limit: 5, window: 3600 }, // 5 per hour
  pin: { limit: 3, window: 2592000 }, // 3 per 30 days
} as const;

export type Category = typeof CATEGORIES[number];
