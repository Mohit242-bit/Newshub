export interface Article {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  author?: string;
  source: string;
  publishedAt: string;
  category: Category;
  readTime?: number;
  tags?: string[];
}

export enum Category {
  ALL = 'all',
  SOFTWARE = 'software',
  TECH = 'tech',
  AI_ML = 'ai_ml',
  WEB_DEV = 'web_dev',
  MOBILE_DEV = 'mobile_dev',
  POLITICAL = 'political', 
  INDIA = 'india',
  SPORTS = 'sports',
  BUSINESS = 'business',
  WORLD = 'world',
  BREAKING = 'breaking',
  SCIENCE = 'science',
  STARTUPS = 'startups',
  COOKING = 'cooking'
}

export interface NewsSource {
  name: string;
  url: string;
  category: Category[];
  type: 'api' | 'rss';
  priority: number; // Lower = higher priority
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface FetchArticlesOptions {
  category: Category;
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'popularity';
  searchQuery?: string;
}

export interface ServiceResponse<T> {
  data: T;
  source: string;
  timestamp: number;
  hasMore: boolean;
  totalResults?: number;
}

export interface CategoryConfig {
  displayName: string;
  icon: string;
  color: string;
  primarySources: string[];
  fallbackSources: string[];
}
