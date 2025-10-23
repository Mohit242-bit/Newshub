import { Article, Category, ServiceResponse } from '../types/Article';

interface ESPNArticle {
  links: {
    source: Array<{
      href: string;
    }>;
    web: Array<{
      href: string;
    }>;
  };
  headline: string;
  description: string;
  images?: Array<{
    full?: {
      href: string;
    };
  }>;
  published: string;
  byline?: string;
}

interface ESPNResponse {
  articles?: ESPNArticle[];
}

class ESPNService {
  private static instance: ESPNService;
  private readonly BASE_URL = 'https://site.api.espn.com/v2/site/en/news';
  private readonly CACHE: Map<string, { data: Article[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  static getInstance(): ESPNService {
    if (!ESPNService.instance) {
      ESPNService.instance = new ESPNService();
    }
    return ESPNService.instance;
  }

  private mapESPNArticle(item: ESPNArticle, category: Category): Article {
    const sourceUrl = item.links?.source?.[0]?.href || item.links?.web?.[0]?.href || '';
    const imageUrl = item.images?.[0]?.full?.href || undefined;

    return {
      id: `espn-${item.headline.replace(/\s+/g, '-')}-${Date.now()}`,
      title: item.headline,
      description: item.description || 'No description available',
      url: sourceUrl,
      urlToImage: imageUrl,
      author: item.byline || 'ESPN',
      source: 'ESPN',
      publishedAt: item.published,
      category,
      readTime: Math.ceil((item.description?.length || 0) / 200),
    };
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `espn-${category}-${limit}`;
    const cached = this.CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ Returning cached ESPN articles for ${category}`);
      return {
        data: cached.data,
        source: `ESPN (Cached)`,
        timestamp: cached.timestamp,
        hasMore: cached.data.length >= limit,
        totalResults: cached.data.length,
      };
    }

    try {
      console.log(`🔄 Fetching ${category} articles from ESPN...`);

      const url = this.BASE_URL;
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
          console.error(`❌ ESPN error ${response.status}: ${errorText}`);
          return {
            data: [],
            source: `ESPN (Error: ${response.status})`,
            timestamp: Date.now(),
            hasMore: false,
            totalResults: 0,
          };
        }

        const data: ESPNResponse = await response.json();
        console.log(`📦 Got response: articles=${data.articles?.length || 0}`);

        // Filter articles based on category (ESPN returns mixed sports)
        let filteredArticles = data.articles || [];
        if (category === Category.SPORTS) {
          filteredArticles = filteredArticles;
        }

        const articles = filteredArticles
          .slice(0, limit)
          .map((item) => this.mapESPNArticle(item, category));

        // Cache the results
        this.CACHE.set(cacheKey, { data: articles, timestamp: Date.now() });

        console.log(`✅ Fetched ${articles.length} articles for ${category} from ESPN`);

        return {
          data: articles,
          source: 'ESPN',
          timestamp: Date.now(),
          hasMore: filteredArticles.length > limit,
          totalResults: filteredArticles.length,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`❌ Exception fetching from ESPN:`, error);
      return {
        data: [],
        source: `ESPN (Exception)`,
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  clearCache(): void {
    this.CACHE.clear();
    console.log('🗑️ ESPN cache cleared');
  }
}

export default ESPNService;
