import { Article, Category, ServiceResponse } from '../types/Article';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  cover_image: string | null;
  user: { name: string; username: string };
  published_at: string;
  reading_time_minutes: number;
  tag_list: string[];
}

class DevToService {
  private static instance: DevToService;
  private readonly BASE_URL = 'https://dev.to/api/articles';
  private readonly CACHE: Map<string, { data: Article[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  static getInstance(): DevToService {
    if (!DevToService.instance) {
      DevToService.instance = new DevToService();
    }
    return DevToService.instance;
  }

  private mapDevToArticle(item: DevToArticle, category: Category): Article {
    return {
      id: `devto-${item.id}`,
      title: item.title,
      description: item.description,
      content: undefined,
      url: item.url,
      urlToImage: item.cover_image || undefined,
      author: item.user.name || item.user.username,
      source: 'Dev.to',
      publishedAt: item.published_at,
      category,
      readTime: item.reading_time_minutes,
      tags: item.tag_list,
    };
  }

  private getDevToTags(category: Category): string {
    // Map categories to dev.to tags
    const tagMap: { [key in Category]?: string } = {
      [Category.SOFTWARE]: 'programming',
      [Category.WEB_DEV]: 'webdev',
      [Category.MOBILE_DEV]: 'mobile',
      [Category.TECH]: 'tech',
      [Category.AI_ML]: 'ai',
    };
    return tagMap[category] || 'programming';
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `devto-${category}-${limit}`;
    const cached = this.CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ Returning cached Dev.to articles for ${category}`);
      return {
        data: cached.data,
        source: `Dev.to (Cached)`,
        timestamp: cached.timestamp,
        hasMore: cached.data.length >= limit,
        totalResults: cached.data.length,
      };
    }

    try {
      console.log(`🔄 Fetching ${category} articles from Dev.to...`);
      const tag = this.getDevToTags(category);

      const params = new URLSearchParams();
      params.append('tag', tag);
      params.append('per_page', Math.min(limit, 30).toString());
      params.append('state', 'fresh');

      const url = `${this.BASE_URL}?${params.toString()}`;
      console.log(`🔗 URL: ${url}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`📊 Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Dev.to error ${response.status}: ${errorText}`);
          return {
            data: [],
            source: `Dev.to (Error: ${response.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const data: DevToArticle[] = await response.json();
        console.log(`📦 Got response: articles=${data?.length || 0}`);

        const articles = (data || [])
          .slice(0, limit)
          .map((item) => this.mapDevToArticle(item, category));

        // Cache the results
        this.CACHE.set(cacheKey, { data: articles, timestamp: Date.now() });

        console.log(`✅ Fetched ${articles.length} articles for ${category} from Dev.to`);

        return {
          data: articles,
          source: 'Dev.to',
          timestamp: Date.now(),
          hasMore: (data || []).length > limit,
          totalResults: data?.length || 0,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`❌ Exception fetching from Dev.to:`, error);
      return {
        data: [],
        source: `Dev.to (Exception)`,
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  clearCache(): void {
    this.CACHE.clear();
    console.log('🗑️ Dev.to cache cleared');
  }
}

export default DevToService;
