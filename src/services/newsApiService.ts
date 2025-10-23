import { Article, Category, ServiceResponse } from '../types/Article';
import API_CONFIG from '../config/apiConfig';

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
}

class NewsApiService {
  private static instance: NewsApiService;
  // Multiple API keys to try (in case one is exhausted)
  private apiKeys = [
    API_CONFIG.NEWSAPI_KEY, // Primary key from config
    'demo', // Demo key (limited but works)
  ];
  private currentKeyIndex = 0;
  private readonly BASE_URL = 'https://newsapi.org/v2';
  private readonly CACHE: Map<string, { data: Article[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // Map categories to NewsAPI query strings
  private categoryQueries: { [key in Category]?: string } = {
    [Category.TECH]: 'technology',
    [Category.SOFTWARE]: 'programming OR software development',
    [Category.AI_ML]: 'artificial intelligence OR machine learning',
    [Category.BUSINESS]: 'business',
    [Category.SPORTS]: 'sports',
    [Category.SCIENCE]: 'science',
    [Category.INDIA]: 'India',
    [Category.WORLD]: 'world',
    [Category.BREAKING]: 'breaking news',
  };

  static getInstance(): NewsApiService {
    if (!NewsApiService.instance) {
      NewsApiService.instance = new NewsApiService();
    }
    return NewsApiService.instance;
  }

  private mapArticle(item: NewsAPIResponse['articles'][0], category: Category): Article {
    return {
      id: `${item.url}-${Date.now()}`,
      title: item.title || 'Untitled',
      description: item.description || 'No description available',
      content: item.content || undefined,
      url: item.url,
      urlToImage: item.urlToImage || undefined,
      author: item.author || undefined,
      source: item.source.name,
      publishedAt: item.publishedAt,
      category,
      readTime: Math.ceil((item.content?.length || 0) / 200),
    };
  }

  private getApiKey(): string {
    return this.apiKeys[this.currentKeyIndex];
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `${category}-${limit}`;
    const cached = this.CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ Returning cached articles for ${category}`);
      return {
        data: cached.data,
        source: `NewsAPI.org (Cached)`,
        timestamp: cached.timestamp,
        hasMore: cached.data.length >= limit,
        totalResults: cached.data.length,
      };
    }

    const query = this.categoryQueries[category] || category;

    try {
      console.log(`🔄 Fetching ${category} articles from NewsAPI.org...`);
      const apiKey = this.getApiKey();
      console.log(`📌 Using API key index ${this.currentKeyIndex}`);

      // Build URL with proper encoding
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('sortBy', 'publishedAt');
      params.append('language', 'en');
      params.append('pageSize', Math.min(limit, 100).toString());
      params.append('apiKey', apiKey);

      const url = `${this.BASE_URL}/everything?${params.toString()}`;
      console.log(`🔗 URL: ${url.replace(apiKey, '***')}`);

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
          console.error(`❌ NewsAPI error ${response.status}: ${errorText}`);
          
          // Try next API key on 401 (unauthorized)
          if (response.status === 401 && this.currentKeyIndex < this.apiKeys.length - 1) {
            console.log(`🔄 Trying next API key...`);
            this.currentKeyIndex++;
            return this.getArticles(category, limit);
          }
          
          return {
            data: [],
            source: `NewsAPI.org (Error: ${response.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const data: NewsAPIResponse = await response.json();
        console.log(`📦 Got response: status=${data.status}, articles=${data.articles?.length || 0}`);

        if (data.status !== 'ok') {
          console.error(`❌ NewsAPI error: ${data.status} - ${(data as any).message}`);
          return {
            data: [],
            source: `NewsAPI.org (API Error: ${data.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const articles = data.articles
          .slice(0, limit)
          .map((item) => this.mapArticle(item, category));

        // Cache the results
        this.CACHE.set(cacheKey, { data: articles, timestamp: Date.now() });

        console.log(`✅ Fetched ${articles.length} articles for ${category} from NewsAPI.org`);

        return {
          data: articles,
          source: 'NewsAPI.org',
          timestamp: Date.now(),
          hasMore: data.articles.length > limit,
          totalResults: data.totalResults,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`❌ Exception fetching from NewsAPI.org:`, error);
      return {
        data: [],
        source: `NewsAPI.org (Exception)`,
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  clearCache(): void {
    this.CACHE.clear();
    console.log('🗑️ NewsAPI cache cleared');
  }
}

export default NewsApiService;
