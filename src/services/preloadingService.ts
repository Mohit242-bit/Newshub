import { Article, Category, ServiceResponse } from '../types/Article';
import NetworkService from './networkService';
import PopularityRankingService from './popularityRankingService';

/**
 * Pre-loading Service for NewsHub
 * Loads popular categories in background for instant switching
 */
class PreloadingService {
  private static instance: PreloadingService;
  private networkService = NetworkService.getInstance();
  private popularityService = PopularityRankingService.getInstance();
  
  // Cache for pre-loaded articles
  private preloadedCache: Map<Category, {
    articles: Article[];
    timestamp: number;
    source: string;
  }> = new Map();

  // Priority order for pre-loading (most used categories first)
  private readonly PRELOAD_CATEGORIES: Category[] = [
    Category.ALL,      // Always loaded first
    Category.INDIA,    // High priority
    Category.SOFTWARE, // High priority
    Category.SPORTS,   // Medium priority
    Category.TECH,     // Medium priority
    Category.BREAKING, // Medium priority
    Category.WORLD,    // Low priority
    Category.BUSINESS, // Low priority
  ];

  // Cache TTL (Time To Live) - 15 minutes
  private readonly CACHE_TTL = 15 * 60 * 1000;

  static getInstance(): PreloadingService {
    if (!PreloadingService.instance) {
      PreloadingService.instance = new PreloadingService();
    }
    return PreloadingService.instance;
  }

  /**
   * Start pre-loading process in background
   */
  async startPreloading(): Promise<void> {
    console.log('🚀 Starting background pre-loading...');
    
    // Load categories with progressive delays to avoid overwhelming APIs
    for (let i = 0; i < this.PRELOAD_CATEGORIES.length; i++) {
      const category = this.PRELOAD_CATEGORIES[i];
      
      // Progressive delay: 0ms, 2s, 4s, 6s, etc.
      const delay = i * 2000;
      
      setTimeout(() => {
        this.preloadCategory(category);
      }, delay);
    }
  }

  /**
   * Pre-load a specific category
   */
  private async preloadCategory(category: Category): Promise<void> {
    try {
      console.log(`📱 Pre-loading ${category}...`);
      
      const response = await this.networkService.getArticles(category, 15);
      
      if (response.data.length > 0) {
        // Rank articles by popularity before caching
        const rankedArticles = this.popularityService.rankArticlesByPopularity(response.data, category);
        
        this.preloadedCache.set(category, {
          articles: rankedArticles, // Store enhanced articles with popularity metrics
          timestamp: Date.now(),
          source: response.source,
        });
        
        console.log(`✅ Pre-loaded ${category}: ${response.data.length} articles`);
      }
    } catch (error) {
      console.warn(`❌ Failed to pre-load ${category}:`, error);
    }
  }

  /**
   * Get articles for a category (instant if pre-loaded)
   */
  async getArticles(category: Category): Promise<ServiceResponse<Article[]>> {
    const cached = this.preloadedCache.get(category);
    
    // Check if we have valid cached data
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`⚡ Instant load from cache: ${category}`);
      
      return {
        data: cached.articles,
        source: `${cached.source} (Cached)`,
        timestamp: cached.timestamp,
        hasMore: true,
        totalResults: cached.articles.length,
      };
    }

    // If no cache or expired, load fresh data
    console.log(`🔄 Loading fresh data for: ${category}`);
    
    try {
      const response = await this.networkService.getArticles(category, 20);
      
      // Cache the fresh data with popularity ranking
      if (response.data.length > 0) {
        const rankedArticles = this.popularityService.rankArticlesByPopularity(response.data, category);
        
        this.preloadedCache.set(category, {
          articles: rankedArticles,
          timestamp: Date.now(),
          source: response.source,
        });
        
        // Return ranked articles
        return {
          ...response,
          data: rankedArticles
        };
      }
      
      return response;
    } catch (error) {
      // If fresh load fails, return stale cache if available
      if (cached) {
        console.log(`📦 Using stale cache for ${category} due to error`);
        return {
          data: cached.articles,
          source: `${cached.source} (Offline)`,
          timestamp: cached.timestamp,
          hasMore: false,
          totalResults: cached.articles.length,
        };
      }
      throw error;
    }
  }

  /**
   * Refresh a specific category (force reload)
   */
  async refreshCategory(category: Category): Promise<ServiceResponse<Article[]>> {
    // Remove from cache to force fresh load
    this.preloadedCache.delete(category);
    
    console.log(`🔄 Force refreshing: ${category}`);
    return this.networkService.refreshArticles(category, 20);
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return (Date.now() - timestamp) < this.CACHE_TTL;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { [key: string]: { age: string, articles: number, valid: boolean } } {
    const status: any = {};
    
    this.preloadedCache.forEach((cached, category) => {
      const age = Math.floor((Date.now() - cached.timestamp) / 1000 / 60); // minutes
      status[category] = {
        age: `${age} min ago`,
        articles: cached.articles.length,
        valid: this.isCacheValid(cached.timestamp),
      };
    });
    
    return status;
  }

  /**
   * Refresh all cached categories (background update)
   */
  async refreshAllCached(): Promise<void> {
    console.log('🔄 Background refresh of all cached categories...');
    
    const cachedCategories = Array.from(this.preloadedCache.keys());
    
    for (const category of cachedCategories) {
      // Small delay between refreshes to avoid API overload
      setTimeout(() => {
        this.preloadCategory(category);
      }, Math.random() * 5000); // Random delay 0-5 seconds
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.preloadedCache.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Pre-load related categories based on user's current selection
   */
  async preloadRelatedCategories(currentCategory: Category): Promise<void> {
    const relatedCategories = this.getRelatedCategories(currentCategory);
    
    for (const category of relatedCategories) {
      if (!this.preloadedCache.has(category) || !this.isCacheValid(this.preloadedCache.get(category)!.timestamp)) {
        // Small delay to avoid overwhelming
        setTimeout(() => {
          this.preloadCategory(category);
        }, 1000);
      }
    }
  }

  /**
   * Get categories related to current selection for smart pre-loading
   */
  private getRelatedCategories(category: Category): Category[] {
    const relationships: { [key in Category]?: Category[] } = {
      [Category.ALL]: [Category.INDIA, Category.SOFTWARE, Category.BREAKING],
      [Category.INDIA]: [Category.POLITICAL, Category.SPORTS, Category.BUSINESS],
      [Category.SOFTWARE]: [Category.TECH, Category.WEB_DEV, Category.AI_ML],
      [Category.SPORTS]: [Category.INDIA, Category.WORLD],
      [Category.TECH]: [Category.SOFTWARE, Category.AI_ML, Category.STARTUPS],
      [Category.BREAKING]: [Category.POLITICAL, Category.WORLD],
    };

    return relationships[category] || [Category.ALL];
  }
}

export default PreloadingService;