import { Category } from '../types/Article';

export interface NewsAPIConfig {
  name: string;
  url: string;
  apiKey?: string;
  category: Category[];
  type: 'rest' | 'rss' | 'json';
  priority: number; // 1 = highest priority
  country?: string;
  language?: string;
  isActive: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Real-world news sources configuration
export const NEWS_SOURCES: NewsAPIConfig[] = [
  // Indian News Sources
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    category: [Category.INDIA, Category.BREAKING],
    type: 'rss',
    priority: 2,
    country: 'IN',
    language: 'en',
    isActive: true
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/feeder/default.rss',
    category: [Category.INDIA, Category.POLITICAL],
    type: 'rss',
    priority: 1,
    country: 'IN',
    language: 'en',
    isActive: true
  },
  {
    name: 'Economic Times',
    url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    category: [Category.BUSINESS, Category.INDIA],
    type: 'rss',
    priority: 1,
    country: 'IN',
    language: 'en',
    isActive: true
  },
  {
    name: 'NDTV',
    url: 'https://feeds.feedburner.com/NDTV-LatestNews',
    category: [Category.INDIA, Category.BREAKING],
    type: 'rss',
    priority: 2,
    country: 'IN',
    language: 'en',
    isActive: true
  },
  
  // Technology Sources
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: [Category.TECH, Category.STARTUPS],
    type: 'rss',
    priority: 1,
    language: 'en',
    isActive: true
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: [Category.TECH],
    type: 'rss',
    priority: 2,
    language: 'en',
    isActive: true
  },
  {
    name: 'Ars Technica',
    url: 'http://feeds.arstechnica.com/arstechnica/index',
    category: [Category.TECH, Category.SCIENCE],
    type: 'rss',
    priority: 2,
    language: 'en',
    isActive: true
  },
  
  // Software Development Sources
  {
    name: 'Dev.to',
    url: 'https://dev.to/api/articles?top=7', // Last 7 days top articles
    category: [Category.SOFTWARE, Category.WEB_DEV],
    type: 'json',
    priority: 1,
    language: 'en',
    isActive: true,
    rateLimit: { requests: 10, windowMs: 60000 } // 10 requests per minute
  },
  {
    name: 'Hacker News',
    url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20',
    category: [Category.SOFTWARE, Category.TECH],
    type: 'json',
    priority: 1,
    language: 'en',
    isActive: true
  },
  {
    name: 'GitHub Blog',
    url: 'https://github.blog/feed.xml',
    category: [Category.SOFTWARE],
    type: 'rss',
    priority: 2,
    language: 'en',
    isActive: true
  },
  
  // Science & AI Sources
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: [Category.SCIENCE, Category.AI_ML],
    type: 'rss',
    priority: 1,
    language: 'en',
    isActive: true
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    category: [Category.AI_ML],
    type: 'rss',
    priority: 1,
    language: 'en',
    isActive: true
  },
  
  // Sports Sources
  {
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    category: [Category.SPORTS],
    type: 'rss',
    priority: 1,
    language: 'en',
    isActive: true
  },
  {
    name: 'Cricinfo',
    url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    category: [Category.SPORTS],
    type: 'rss',
    priority: 2,
    country: 'IN',
    language: 'en',
    isActive: true
  },
  
  // World News Sources
  {
    name: 'BBC World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: [Category.WORLD, Category.BREAKING],
    type: 'rss',
    priority: 1,
    language: 'en',
    isActive: true
  },
  {
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best',
    category: [Category.WORLD, Category.BUSINESS],
    type: 'rss',
    priority: 1,
    language: 'en',
    isActive: true
  },
  
  // Business & Startup Sources
  {
    name: 'YourStory',
    url: 'https://yourstory.com/feed',
    category: [Category.STARTUPS, Category.BUSINESS],
    type: 'rss',
    priority: 1,
    country: 'IN',
    language: 'en',
    isActive: true
  }
];

// Get sources by category
export function getSourcesByCategory(category: Category): NewsAPIConfig[] {
  return NEWS_SOURCES.filter(source => 
    source.isActive && source.category.includes(category)
  ).sort((a, b) => a.priority - b.priority);
}

// Get high-priority sources for breaking news
export function getBreakingNewsSources(): NewsAPIConfig[] {
  return NEWS_SOURCES.filter(source => 
    source.isActive && 
    source.priority === 1 && 
    source.category.includes(Category.BREAKING)
  );
}

// Get Indian news sources specifically
export function getIndianSources(): NewsAPIConfig[] {
  return NEWS_SOURCES.filter(source => 
    source.isActive && 
    (source.country === 'IN' || source.category.includes(Category.INDIA))
  ).sort((a, b) => a.priority - b.priority);
}

// Configuration for NewsAPI.org (paid service)
export const NEWSAPI_CONFIG = {
  baseUrl: 'https://newsapi.org/v2',
  apiKey: 'your_api_key_here', // Replace with actual API key
  endpoints: {
    topHeadlines: '/top-headlines',
    everything: '/everything',
    sources: '/sources'
  },
  supportedCountries: ['in', 'us', 'gb', 'au'],
  categories: ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
};

// Popular search terms for trending detection
export const TRENDING_KEYWORDS = {
  [Category.INDIA]: [
    'modi', 'parliament', 'election', 'supreme court', 'budget', 
    'bollywood', 'cricket', 'ipl', 'bangalore', 'mumbai', 'delhi',
    'startup', 'unicorn', 'ipo', 'sensex', 'nifty'
  ],
  [Category.TECH]: [
    'apple', 'google', 'microsoft', 'meta', 'tesla', 'openai',
    'iphone', 'android', 'ai', 'chatgpt', 'crypto', 'bitcoin',
    'quantum', 'semiconductor', '5g', 'startup'
  ],
  [Category.SOFTWARE]: [
    'react', 'javascript', 'python', 'typescript', 'node.js',
    'github', 'open source', 'security', 'vulnerability',
    'release', 'update', 'framework', 'library'
  ],
  [Category.AI_ML]: [
    'chatgpt', 'openai', 'machine learning', 'deep learning',
    'neural network', 'llm', 'gpt', 'artificial intelligence',
    'automation', 'robot', 'breakthrough'
  ]
};

// Real-time trending detection (simulated)
export function getTrendingTopics(): string[] {
  const currentHour = new Date().getHours();
  
  // Different trending topics based on time of day
  if (currentHour >= 9 && currentHour <= 17) {
    // Business hours - tech and business trends
    return ['AI breakthrough', 'Startup funding', 'Tech IPO', 'Digital transformation'];
  } else if (currentHour >= 18 && currentHour <= 22) {
    // Evening - general news and entertainment
    return ['Breaking news', 'Sports update', 'Market closing', 'Election news'];
  } else {
    // Night/early morning - global news
    return ['Global markets', 'International news', 'Science discovery', 'Technology'];
  }
}