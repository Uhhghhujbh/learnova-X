export const LIMITS = { POST_IMAGES_MAX: 3, PIN_MAX_PER_30_DAYS: 3, POST_EDIT_WINDOW: 15, POST_DELETE_WINDOW: 60, FILE_SIZE_MAX: 1048576, COMMENTS_PER_MINUTE: 10, LIKES_PER_SECOND: 1, SEARCH_DEBOUNCE: 500, POSTS_PER_PAGE: 20, CACHE_USER_PROFILE: 300, CACHE_POST_LIST: 30 };
export const CATEGORIES = ['education', 'business', 'jobs', 'tech', 'health', 'others'] as const;
export const ROLES = { USER: 'user', ADMIN: 'admin' } as const;
export const THEME = { LIGHT: 'light', DARK: 'dark' } as const;