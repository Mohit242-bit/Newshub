import { Article, Category, ServiceResponse } from '../types/Article';
import API_CONFIG from '../config/apiConfig';

class IndianNewsService {
  private static instance: IndianNewsService;
  // Using NewsAPI but with India-focused queries
  private readonly BASE_URL = 'https://newsapi.org/v2/everything';
  private readonly API_KEY = API_CONFIG.NEWSAPI_KEY;
  private readonly CACHE: Map<string, { data: Article[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // Map categories to India-specific queries
  private indianNewsQueries: { [key in Category]?: string } = {
    [Category.INDIA]: 'India',
    [Category.POLITICAL]: 'Indian politics OR parliament',
    [Category.BUSINESS]: 'India business OR Indian economy',
    [Category.SPORTS]: 'India cricket OR Indian sports',
    [Category.BREAKING]: 'India breaking news',
  };

  static getInstance(): IndianNewsService {
    if (!IndianNewsService.instance) {
      IndianNewsService.instance = new IndianNewsService();
    }
    return IndianNewsService.instance;
  }

  private mapIndianArticle(item: any, category: Category): Article {
    return {
      id: `india-${item.url}-${Date.now()}`,
      title: item.title || 'Untitled',
      description: item.description || 'No description available',
      content: item.content || undefined,
      url: item.url,
      urlToImage: item.urlToImage || undefined,
      author: item.author || undefined,
      source: item.source?.name || 'Indian News',
      publishedAt: item.publishedAt,
      category,
      readTime: Math.ceil((item.content?.length || 0) / 200),
    };
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `india-${category}-${limit}`;
    const cached = this.CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ Returning cached Indian News articles for ${category}`);
      return {
        data: cached.data,
        source: `Indian News (Cached)`,
        timestamp: cached.timestamp,
        hasMore: cached.data.length >= limit,
        totalResults: cached.data.length,
      };
    }

    try {
      console.log(`🔄 Fetching ${category} articles from Indian News...`);

      const query = this.indianNewsQueries[category] || 'India';

      const params = new URLSearchParams();
      params.append('q', query);
      params.append('sortBy', 'publishedAt');
      params.append('language', 'en');
      params.append('pageSize', Math.min(limit, 100).toString());
      params.append('apiKey', this.API_KEY);

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
          console.error(`❌ Indian News error ${response.status}: ${errorText}`);
          return {
            data: [],
            source: `Indian News (Error: ${response.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const data: any = await response.json();
        console.log(`📦 Got response: status=${data.status}, articles=${data.articles?.length || 0}`);

        if (data.status !== 'ok') {
          console.error(`❌ Indian News API error: ${data.status}`);
          return {
            data: [],
            source: `Indian News (API Error)`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        // Filter for India-specific news (optional enhancement)
        let articles = (data.articles || [])
          .filter((article: any) => {
            const content = `${article.title} ${article.description}`.toLowerCase();
            return content.includes('india') || category === Category.ALL;
          })
          .slice(0, limit)
          .map((item: any) => this.mapIndianArticle(item, category));

        // If no India-specific articles found, return what we got
        if (articles.length === 0 && data.articles?.length > 0) {
          articles = data.articles
            .slice(0, limit)
            .map((item: any) => this.mapIndianArticle(item, category));
        }

        // Cache the results
        this.CACHE.set(cacheKey, { data: articles, timestamp: Date.now() });

        console.log(`✅ Fetched ${articles.length} articles for ${category} from Indian News`);

        return {
          data: articles,
          source: 'Indian News',
          timestamp: Date.now(),
          hasMore: data.articles?.length > limit,
          totalResults: data.totalResults,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`❌ Exception fetching from Indian News:`, error);
      return {
        data: [],
        source: `Indian News (Exception)`,
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  clearCache(): void {
    this.CACHE.clear();
    console.log('🗑️ Indian News cache cleared');
  }
}

export default IndianNewsService;
