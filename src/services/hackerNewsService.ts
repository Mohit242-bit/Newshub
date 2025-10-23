import { Article, Category, ServiceResponse } from '../types/Article';

interface HNItem {
  id: number;
  title: string;
  url: string;
  by: string;
  time: number;
  score: number;
  descendants: number;
  text?: string;
}

class HackerNewsService {
  private static instance: HackerNewsService;
  private readonly BASE_URL = 'https://hacker-news.firebaseio.com/v0';
  private readonly CACHE: Map<string, { data: Article[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  static getInstance(): HackerNewsService {
    if (!HackerNewsService.instance) {
      HackerNewsService.instance = new HackerNewsService();
    }
    return HackerNewsService.instance;
  }

  private mapHNItemToArticle(item: HNItem, category: Category): Article {
    const publishedAt = new Date(item.time * 1000).toISOString();
    const estimatedReadTime = Math.max(Math.ceil((item.title.length + (item.text?.length || 0)) / 200), 1);
    
    return {
      id: `hn-${item.id}`,
      title: item.title,
      description: item.text || `HackerNews discussion with ${item.descendants || 0} comments`,
      content: item.text,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      urlToImage: undefined, // HN doesn't provide images
      author: item.by,
      source: 'Hacker News',
      publishedAt,
      category,
      readTime: estimatedReadTime,
    };
  }

  private getCategoryStories(category: Category): string {
    // HN has limited categories, so we map our categories to their story types
    switch (category) {
      case Category.TECH:
      case Category.SOFTWARE:
      case Category.AI_ML:
      case Category.ALL:
        return 'topstories';
      default:
        return 'topstories';
    }
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `hn-${category}-${limit}`;
    const cached = this.CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ Returning cached HN articles for ${category}`);
      return {
        data: cached.data,
        source: 'Hacker News (Cached)',
        timestamp: cached.timestamp,
        hasMore: cached.data.length >= limit,
        totalResults: cached.data.length,
      };
    }

    try {
      console.log(`🔄 Fetching ${category} articles from Hacker News...`);
      const storyType = this.getCategoryStories(category);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        // Get list of story IDs
        const response = await fetch(`${this.BASE_URL}/${storyType}.json`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`❌ HN API error: ${response.status}`);
          return {
            data: [],
            source: `Hacker News (Error: ${response.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const storyIds: number[] = await response.json();
        console.log(`📊 Got ${storyIds.length} story IDs from HN`);

        // Fetch details for first N stories (limited to avoid too many parallel requests)
        const storiesToFetch = storyIds.slice(0, Math.min(limit * 1.5, 30)); // Fetch fewer for faster loading
        const articles: Article[] = [];
        
        // Fetch stories sequentially to avoid overwhelming the API
        for (const id of storiesToFetch) {
          if (articles.length >= limit) break;
          
          try {
            const itemController = new AbortController();
            const itemTimeoutId = setTimeout(() => itemController.abort(), 5000);
            
            const itemResponse = await fetch(`${this.BASE_URL}/item/${id}.json`, {
              signal: itemController.signal,
            });
            
            clearTimeout(itemTimeoutId);
            
            if (itemResponse.ok) {
              const item: HNItem = await itemResponse.json();
              // Only return stories with titles and URLs (not Ask HN, etc.)
              if (item.title && (item.url || item.text)) {
                articles.push(this.mapHNItemToArticle(item, category));
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fetch HN story ${id}:`, error);
          }
        }

        // Cache the results
        this.CACHE.set(cacheKey, { data: articles, timestamp: Date.now() });

        console.log(`✅ Fetched ${articles.length} articles for ${category} from Hacker News`);

        return {
          data: articles,
          source: 'Hacker News',
          timestamp: Date.now(),
          hasMore: articles.length >= limit,
          totalResults: storyIds.length,
        };
      } finally {
        // Ensure timeout is cleared
      }
    } catch (error) {
      console.error(`❌ Exception fetching from Hacker News:`, error);
      return {
        data: [],
        source: 'Hacker News (Exception)',
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  clearCache(): void {
    this.CACHE.clear();
    console.log('🗑️ HackerNews cache cleared');
  }
}

export default HackerNewsService;