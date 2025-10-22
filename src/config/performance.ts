// Performance optimization settings for NewsHub
import { Category } from '../types/Article';

export const PERFORMANCE_CONFIG = {
  // Network timeouts (in milliseconds)
  FETCH_TIMEOUT: 3000, // Further reduced for even faster fallback
  RETRY_TIMEOUT: 1000, // Further reduced
  
  // Cache settings
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes for fresher content
  CACHE_MAX_SIZE: 150, // Increased cache size
  
  // Pagination
  DEFAULT_PAGE_SIZE: 25, // Increased for more variety
  MAX_PAGE_SIZE: 50,
  
  // Rate limiting
  API_RATE_LIMIT: {
    requests: 50, // Increased from 30
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Error handling
  MAX_RETRIES: 2, // Reduced from 3 for faster fallback
  BACKOFF_BASE_DELAY: 500, // Reduced from 1000
  
  // UI Performance
  DEBOUNCE_DELAY: 300,
  LAZY_LOAD_THRESHOLD: 5, // Load more when 5 items from bottom
  
  // Development flags
  ENABLE_DEBUG_LOGS: __DEV__,
  ENABLE_PERFORMANCE_MONITORING: __DEV__,
};

export const ENDPOINT_PRIORITIES = {
  // Higher priority = tried first
  'dev.to': 1,
  'hackernews': 2,
  'guardian': 1,
  'espn': 2,
  'indian-news': 1,
};

export const FALLBACK_CHAINS = {
  [Category.SOFTWARE]: ['dev.to', 'hackernews'],
  [Category.SPORTS]: ['espn'],
  [Category.POLITICAL]: ['guardian', 'indian-news'],
  [Category.INDIA]: ['indian-news', 'guardian'],
  [Category.WORLD]: ['guardian', 'indian-news'],
  [Category.BUSINESS]: ['guardian', 'indian-news'],
  [Category.BREAKING]: ['guardian', 'indian-news'],
  [Category.ALL]: ['dev.to', 'indian-news', 'guardian', 'espn'],
};
