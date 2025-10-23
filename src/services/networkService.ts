import { Category, ServiceResponse, Article } from '../types/Article';
import NewsApiService from './newsApiService';
import HackerNewsService from './hackerNewsService';
import MockDataService from './mockDataService';
import DevToService from './devToService';
import GuardianService from './guardianService';
import ESPNService from './espnService';
import IndianNewsService from './indianNewsService';

class NetworkService {
  private static instance: NetworkService;
  private newsApiService = NewsApiService.getInstance();
  private hackerNewsService = HackerNewsService.getInstance();
  private devToService = DevToService.getInstance();
  private guardianService = GuardianService.getInstance();
  private espnService = ESPNService.getInstance();
  private indianNewsService = IndianNewsService.getInstance();
  private mockDataService = MockDataService.getInstance();
  private isNetworkAvailable: boolean = true;
  
  // Category to primary service mapping
  private categoryServiceMap: { [key in Category]?: string[] } = {
    [Category.SOFTWARE]: ['devto', 'hackernews', 'newsapi'],
    [Category.WEB_DEV]: ['devto', 'newsapi', 'hackernews'],
    [Category.MOBILE_DEV]: ['devto', 'newsapi'],
    [Category.TECH]: ['hackernews', 'guardian', 'newsapi'],
    [Category.AI_ML]: ['hackernews', 'newsapi', 'devto'],
    [Category.INDIA]: ['indiannews', 'guardian', 'newsapi'],
    [Category.POLITICAL]: ['indiannews', 'guardian', 'newsapi'],
    [Category.SPORTS]: ['espn', 'guardian', 'newsapi'],
    [Category.BUSINESS]: ['guardian', 'newsapi'],
    [Category.WORLD]: ['guardian', 'newsapi'],
    [Category.BREAKING]: ['guardian', 'newsapi', 'hackernews'],
    [Category.SCIENCE]: ['guardian', 'newsapi'],
    [Category.STARTUPS]: ['newsapi', 'devto', 'hackernews'],
    [Category.ALL]: ['newsapi', 'hackernews', 'guardian'],
  };

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    // Network availability will be checked lazily when needed
    console.log('📡 NetworkService initialized');
  }

  private checkNetworkStatus(): void {
    // Check network status once, asynchronously
    // Do NOT use setInterval to avoid continuous background tasks
    if (!this.isNetworkAvailable) {
      // Only check if we think network is down
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        fetch('https://newsapi.org/v2', { method: 'HEAD', signal: controller.signal })
          .then(() => {
            clearTimeout(timeoutId);
            this.isNetworkAvailable = true;
            console.log('✅ Network became available');
          })
          .catch((err: any) => {
            clearTimeout(timeoutId);
            console.warn('⚠️ Network check failed:', err?.message);
            // Keep current status, don't update
          });
      } catch (err) {
        console.warn('⚠️ Network check exception:', err);
      }
    }
  }

  /**
   * Remove duplicate articles based on title similarity
   */
  private removeDuplicates(articles: Article[]): Article[] {
    if (articles.length === 0) return articles;
    
    const seen = new Map<string, Article>();
    
    for (const article of articles) {
      const normalizedTitle = article.title.toLowerCase().trim();
      let isDuplicate = false;
      
      // Check against existing articles for similarity
      for (const [existingTitle] of seen) {
        if (this.isSimilarTitle(normalizedTitle, existingTitle)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        seen.set(normalizedTitle, article);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Check if two titles are similar (70% word match)
   */
  private isSimilarTitle(title1: string, title2: string): boolean {
    const normalize = (t: string) => 
      t.replace(/[^\w\s]/g, '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const words1 = new Set(normalize(title1));
    const words2 = new Set(normalize(title2));
    
    if (words1.size === 0 && words2.size === 0) return true;
    if (words1.size === 0 || words2.size === 0) return false;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = union.size > 0 ? intersection.size / union.size : 0;
    return similarity >= 0.7;
  }

  /**
   * Get articles using category-specific service routing
   */
  private async tryService(serviceName: string, category: Category, limit: number): Promise<ServiceResponse<Article[]> | null> {
    try {
      switch (serviceName) {
        case 'devto':
          return await this.devToService.getArticles(category, limit);
        case 'guardian':
          return await this.guardianService.getArticles(category, limit);
        case 'espn':
          return await this.espnService.getArticles(category, limit);
        case 'indiannews':
          return await this.indianNewsService.getArticles(category, limit);
        case 'hackernews':
          return await this.hackerNewsService.getArticles(category, limit);
        case 'newsapi':
          return await this.newsApiService.getArticles(category, limit);
        default:
          return null;
      }
    } catch (error) {
      console.warn(`⚠️ Service ${serviceName} failed:`, error);
      return null;
    }
  }

  /**
   * Get articles - tries category-specific services with fallback chain
   */
  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    console.log(`🎯 Fetching ${category} articles (network: ${this.isNetworkAvailable ? 'available' : 'unavailable'})`);
    
    try {
      if (!this.isNetworkAvailable) {
        console.warn(`⚠️ Network unavailable, falling back to mock data for ${category}`);
        const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
        mockResult.data = this.removeDuplicates(mockResult.data);
        return mockResult;
      }

      // Get the service chain for this category
      const serviceChain = this.categoryServiceMap[category] || ['newsapi', 'hackernews'];
      console.log(`📡 Trying services in order: ${serviceChain.join(' → ')} for ${category}`);

      // Try each service in the chain
      for (const serviceName of serviceChain) {
        console.log(`   ↳ Attempting ${serviceName}...`);
        const result = await this.tryService(serviceName, category, limit);
        
        if (result && result.data.length > 0) {
          // Apply deduplication before returning
          result.data = this.removeDuplicates(result.data);
          console.log(`✅ Got ${result.data.length} unique articles from ${serviceName} for ${category}`);
          return result;
        }
      }

      // All primary services failed, try mock data
      console.log(`📦 All services exhausted, falling back to mock data for ${category}`);
      const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
      mockResult.data = this.removeDuplicates(mockResult.data);
      return mockResult;
    } catch (error) {
      console.error(`❌ Error fetching ${category} articles:`, error);
      
      // Last resort: try mock data
      try {
        const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
        mockResult.data = this.removeDuplicates(mockResult.data);
        return {
          ...mockResult,
          source: `${mockResult.source} (Error fallback)`
        };
      } catch (mockError) {
        // If even mock fails, return empty
        return {
          data: [],
          source: 'Error - No articles available',
          timestamp: Date.now(),
          hasMore: false,
          totalResults: 0
        };
      }
    }
  }

  /**
   * Check if network is currently available
   */
  getNetworkStatus(): boolean {
    return this.isNetworkAvailable;
  }

  /**
   * Manual refresh - clears cache and fetches fresh data using service routing
   */
  async refreshArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    console.log(`🔄 Refreshing ${category}...`);
    
    try {
      // Clear caches for fresh data
      this.devToService.clearCache();
      this.guardianService.clearCache();
      this.espnService.clearCache();
      this.indianNewsService.clearCache();
      this.hackerNewsService.clearCache();
      this.newsApiService.clearCache();
      
      // Fetch fresh data using the same service chain
      return await this.getArticles(category, limit);
    } catch (error) {
      console.error('Failed to refresh articles:', error);
      return this.getArticles(category, limit);
    }
  }
}

export default NetworkService;