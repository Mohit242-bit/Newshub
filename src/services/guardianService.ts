import { Article, Category, ServiceResponse } from '../types/Article';
import API_CONFIG from '../config/apiConfig';

interface GuardianArticle {
  id: string;
  type: string;
  sectionId: string;
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  fields?: {
    thumbnail?: string;
    byline?: string;
    trailText?: string;
  };
}

interface GuardianResponse {
  response: {
    status: string;
    total: number;
    results: GuardianArticle[];
  };
}

class GuardianService {
  private static instance: GuardianService;
  private readonly BASE_URL = 'https://open.guardian.com/search';
  private readonly API_KEY = API_CONFIG.GUARDIAN_API_KEY; // Get from config
  private readonly CACHE: Map<string, { data: Article[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  static getInstance(): GuardianService {
    if (!GuardianService.instance) {
      GuardianService.instance = new GuardianService();
    }
    return GuardianService.instance;
  }

  private mapGuardianArticle(item: GuardianArticle, category: Category): Article {
    return {
      id: `guardian-${item.id}`,
      title: item.webTitle,
      description: item.fields?.trailText || 'No description available',
      url: item.webUrl,
      urlToImage: item.fields?.thumbnail || undefined,
      author: item.fields?.byline || undefined,
      source: 'The Guardian',
      publishedAt: item.webPublicationDate,
      category,
      readTime: Math.ceil((item.fields?.trailText?.length || 0) / 200),
    };
  }

  private getGuardianSection(category: Category): string {
    // Map categories to Guardian sections
    const sectionMap: { [key in Category]?: string } = {
      [Category.TECH]: 'technology',
      [Category.BUSINESS]: 'business',
      [Category.WORLD]: 'world',
      [Category.SCIENCE]: 'science',
      [Category.SPORTS]: 'sport',
      [Category.BREAKING]: 'news',
    };
    return sectionMap[category] || 'news';
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `guardian-${category}-${limit}`;
    const cached = this.CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ Returning cached Guardian articles for ${category}`);
      return {
        data: cached.data,
        source: `The Guardian (Cached)`,
        timestamp: cached.timestamp,
        hasMore: cached.data.length >= limit,
        totalResults: cached.data.length,
      };
    }

    try {
      console.log(`🔄 Fetching ${category} articles from The Guardian...`);
      const section = this.getGuardianSection(category);

      const params = new URLSearchParams();
      params.append('section', section);
      params.append('page-size', Math.min(limit, 50).toString());
      params.append('order-by', 'newest');
      params.append('show-fields', 'thumbnail,byline,trailText');
      params.append('api-key', this.API_KEY);

      const url = `${this.BASE_URL}?${params.toString()}`;
      console.log(`🔗 URL: ${url.replace(this.API_KEY, '***')}`);

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
          console.error(`❌ Guardian error ${response.status}: ${errorText}`);
          return {
            data: [],
            source: `The Guardian (Error: ${response.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const data: GuardianResponse = await response.json();
        console.log(`📦 Got response: articles=${data.response.results?.length || 0}`);

        if (data.response.status !== 'ok') {
          console.error(`❌ Guardian API error: ${data.response.status}`);
          return {
            data: [],
            source: `The Guardian (API Error)`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const articles = (data.response.results || [])
          .slice(0, limit)
          .map((item) => this.mapGuardianArticle(item, category));

        // Cache the results
        this.CACHE.set(cacheKey, { data: articles, timestamp: Date.now() });

        console.log(`✅ Fetched ${articles.length} articles for ${category} from The Guardian`);

        return {
          data: articles,
          source: 'The Guardian',
          timestamp: Date.now(),
          hasMore: (data.response.results || []).length > limit,
          totalResults: data.response.total,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`❌ Exception fetching from The Guardian:`, error);
      return {
        data: [],
        source: `The Guardian (Exception)`,
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  clearCache(): void {
    this.CACHE.clear();
    console.log('🗑️ Guardian cache cleared');
  }
}

export default GuardianService;
