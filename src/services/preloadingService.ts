import { Article, Category, ServiceResponse } from '../types/Article';
import NetworkService from './networkService';
import PopularityRankingService from './popularityRankingService';

/**
 * Pre-loading Service for NewsHub
 * Loads popular categories in background for instant switching
 */
class PreloadingService {
  private static instance: PreloadingService;
  private networkService: any = null;
  private popularityService: any = null;
  
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

  private getNetworkService(): any {
    if (!this.networkService) {
      try {
        this.networkService = NetworkService.getInstance();
      } catch (err) {
        console.error('❌ Failed to initialize NetworkService:', err);
        throw err;
      }
    }
    return this.networkService;
  }

  private getPopularityService(): any {
    if (!this.popularityService) {
      try {
        this.popularityService = PopularityRankingService.getInstance();
      } catch (err) {
        console.error('❌ Failed to initialize PopularityRankingService:', err);
        throw err;
      }
    }
    return this.popularityService;
  }

  /**
   * Start pre-loading process in background
   */
  async startPreloading(): Promise<void> {
    console.log('🚀 Starting background pre-loading...');
    
    try {
      // Load categories with progressive delays to avoid overwhelming APIs
      for (let i = 0; i < this.PRELOAD_CATEGORIES.length; i++) {
        const category = this.PRELOAD_CATEGORIES[i];
        
        // Progressive delay: 0ms, 2s, 4s, 6s, etc.
        const delay = i * 2000;
        
        setTimeout(() => {
          this.preloadCategory(category).catch(err => {
            console.warn(`⚠️ Background pre-loading error for ${category}:`, err);
          });
        }, delay);
      }
    } catch (error) {
      console.error('❌ Error starting pre-loading:', error);
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
   * Pre-load a specific category
   */
  private async preloadCategory(category: Category): Promise<void> {
    try {
      console.log(`📱 Pre-loading ${category}...`);
      
      const networkService = this.getNetworkService();
      const response = await networkService.getArticles(category, 25);
      
      if (response.data.length > 0) {
        // Remove duplicates first
        let articles = this.removeDuplicates(response.data);
        
        // Rank articles by popularity before caching
        const popularityService = this.getPopularityService();
        const rankedArticles = popularityService.rankArticlesByPopularity(articles, category);
        
        this.preloadedCache.set(category, {
          articles: rankedArticles,
          timestamp: Date.now(),
          source: response.source,
        });
        
        console.log(`✅ Pre-loaded ${category}: ${rankedArticles.length} unique articles`);
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
      const response = await this.networkService.getArticles(category, 30);
      
      // Cache the fresh data with popularity ranking
      if (response.data.length > 0) {
        // Remove duplicates first
        let articles = this.removeDuplicates(response.data);
        
        const rankedArticles = this.popularityService.rankArticlesByPopularity(articles, category);
        
        this.preloadedCache.set(category, {
          articles: rankedArticles,
          timestamp: Date.now(),
          source: response.source,
        });
        
        // Return articles directly
        return {
          ...response,
          data: articles
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
    return this.networkService.refreshArticles(category, 30);
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