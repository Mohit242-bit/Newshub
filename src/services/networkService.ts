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
        return await this.mockDataService.getMockArticlesAsync(category, limit);
      }

      // Get the service chain for this category
      const serviceChain = this.categoryServiceMap[category] || ['newsapi', 'hackernews'];
      console.log(`📡 Trying services in order: ${serviceChain.join(' → ')} for ${category}`);

      // Try each service in the chain
      for (const serviceName of serviceChain) {
        console.log(`   ↳ Attempting ${serviceName}...`);
        const result = await this.tryService(serviceName, category, limit);
        
        if (result && result.data.length > 0) {
          console.log(`✅ Got ${result.data.length} articles from ${serviceName} for ${category}`);
          return result;
        }
      }

      // All primary services failed, try mock data
      console.log(`📦 All services exhausted, falling back to mock data for ${category}`);
      const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
      return mockResult;
    } catch (error) {
      console.error(`❌ Error fetching ${category} articles:`, error);
      
      // Last resort: try mock data
      try {
        const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
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