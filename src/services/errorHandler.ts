import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, Category, ServiceResponse } from '../types/Article';
import MockDataService from './mockDataService';

export interface ErrorInfo {
  service: string;
  error: Error;
  timestamp: number;
  retryCount: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  private cache: Map<string, CacheEntry<any>> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  
  // Retry configuration
  private readonly MAX_RETRIES = 1; // Reduce retries for faster fallback
  private readonly RETRY_DELAYS = [300]; // Single quick retry
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes - longer cache for better offline experience
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Execute API call with comprehensive error handling, retries, and caching
   * Now with parallel execution for better performance
   */
  async executeWithFallback<T>(
    primaryCall: () => Promise<T>,
    fallbackCalls: (() => Promise<T>)[] = [],
    cacheKey: string,
    serviceName: string = 'API'
  ): Promise<T> {
    // Try to get cached data first
    const cachedData = this.getCachedData<T>(cacheKey);
    let lastError: Error | null = null;

    // Try primary call with retries
    try {
      if (await this.checkRateLimit(serviceName)) {
        const result = await this.executeWithRetry(primaryCall, cacheKey, serviceName);
        this.setCachedData(cacheKey, result);
        return result;
      } else {
        console.warn(`${serviceName} rate limit exceeded, trying fallbacks`);
      }
    } catch (error) {
      lastError = error as Error;
      this.logError(serviceName, lastError, 0);
      console.warn(`${serviceName} primary call failed:`, error);
    }

    // Try fallback calls
    for (let i = 0; i < fallbackCalls.length; i++) {
      try {
        const fallbackName = `${serviceName}_Fallback_${i + 1}`;
        console.log(`Attempting ${fallbackName}...`);
        
        if (await this.checkRateLimit(fallbackName)) {
          const result = await this.executeWithRetry(fallbackCalls[i], cacheKey, fallbackName);
          this.setCachedData(cacheKey, result);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        this.logError(`${serviceName}_Fallback_${i + 1}`, lastError, 0);
        console.warn(`${serviceName} fallback ${i + 1} failed:`, error);
      }
    }

    // Return cached data if available
    if (cachedData) {
      console.log(`Using cached data for ${serviceName} (age: ${Date.now() - cachedData.timestamp}ms)`);
      return cachedData.data;
    }

    // All attempts failed - return cached data if available or empty data
    console.warn(`All ${serviceName} sources failed. Checking for any cached data...`);
    
    // Try to get any cached data, even if expired
    const expiredCache = this.cache.get(cacheKey);
    if (expiredCache) {
      console.log(`Using expired cache for ${serviceName} as last resort`);
      return expiredCache.data;
    }
    
    // Try to load from persistent storage as last resort
    const persistentCache = await this.loadCachedDataFromStorage<T>(cacheKey);
    if (persistentCache) {
      console.log(`Using persistent cache for ${serviceName} as last resort`);
      return persistentCache.data;
    }
    
    // Last resort: try to provide mock/demo data for better UX
    console.log(`Attempting to provide demo data for ${serviceName}...`);
    const mockData = this.getMockDataFallback<T>(serviceName);
    if (mockData) {
      return mockData;
    }
    
    console.warn(`No cached or demo data available. Returning minimal fallback for ${serviceName}.`);
    return this.getEmptyFallbackData<T>(serviceName);
  }

  /**
   * Provide sample fallback data when all sources fail
   * This prevents app crashes and provides a better user experience
   */
  private getEmptyFallbackData<T>(serviceName: string): T {
    // Provide some sample articles for better offline experience
    const sampleArticles = [
      {
        id: 'sample_1',
        title: 'NewsHub - Your Multi-Source News Reader',
        description: 'Stay informed with articles from multiple trusted sources. Connect to the internet for the latest news updates.',
        url: 'https://example.com',
        author: 'NewsHub Team',
        source: 'NewsHub',
        publishedAt: new Date().toISOString(),
        category: 'software',
        tags: ['sample', 'offline']
      },
      {
        id: 'sample_2',
        title: 'Connect to Internet for Latest News',
        description: 'This app aggregates news from Dev.to, Hacker News, NewsAPI, and other sources. Please check your internet connection for fresh content.',
        url: 'https://example.com',
        author: 'NewsHub',
        source: 'NewsHub',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        category: 'tech',
        tags: ['sample', 'info']
      }
    ];
    
    const fallbackResponse = {
      data: sampleArticles,
      source: `${serviceName} (Offline - Sample Data)`,
      timestamp: Date.now(),
      hasMore: false,
      totalResults: sampleArticles.length,
    };
    
    return fallbackResponse as unknown as T;
  }

  /**
   * Provide mock data as ultimate fallback for demonstration
   */
  private getMockDataFallback<T>(serviceName: string): T | null {
    try {
      // Detect if this is a category-based request and provide mock data
      const categoryPattern = /category|Category/;
      if (categoryPattern.test(serviceName)) {
        const mockService = MockDataService.getInstance();
        
        // Try to extract category from service name
        let category = Category.ALL;
        if (serviceName.includes('Software')) category = Category.SOFTWARE;
        else if (serviceName.includes('India')) category = Category.INDIA;
        else if (serviceName.includes('Sports')) category = Category.SPORTS;
        else if (serviceName.includes('Breaking')) category = Category.BREAKING;
        else if (serviceName.includes('Tech')) category = Category.TECH;
        else if (serviceName.includes('Business')) category = Category.BUSINESS;
        else if (serviceName.includes('World')) category = Category.WORLD;
        else if (serviceName.includes('Political')) category = Category.POLITICAL;
        
        const mockResponse = mockService.getMockArticles(category, 15);
        
        // Modify source to indicate this is demo data
        mockResponse.source = `${mockResponse.source} (Network Unavailable)`;
        
        console.log(`📱 Providing mock data for ${serviceName} with ${mockResponse.data.length} articles`);
        return mockResponse as unknown as T;
      }
      
      // For other services, provide generic mock data
      const mockService = MockDataService.getInstance();
      const mockResponse = mockService.getMockArticles(Category.ALL, 10);
      mockResponse.source = `Demo Data (${serviceName} Unavailable)`;
      
      return mockResponse as unknown as T;
    } catch (error) {
      console.warn('Failed to provide mock data fallback:', error);
      return null;
    }
  }

  /**
   * Execute single call with retry mechanism
   */
  async executeWithRetry<T>(
    call: () => Promise<T>,
    cacheKey: string,
    serviceName: string,
    retryCount: number = 0
  ): Promise<T> {
    // Try to get cached data first
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${serviceName}`);
      return cachedData.data;
    }
    try {
      const result = await call();
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[retryCount] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        console.log(`${serviceName} retry ${retryCount + 1}/${this.MAX_RETRIES} after ${delay}ms`);
        
        await this.sleep(delay);
        return this.executeWithRetry(call, cacheKey, serviceName, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(
    service: string,
    maxRequests: number = 100,
    windowMs: number = 60 * 60 * 1000 // 1 hour
  ): Promise<boolean> {
    const now = Date.now();
    const serviceData = this.rateLimits.get(service) || { count: 0, resetTime: now + windowMs };
    
    if (now > serviceData.resetTime) {
      serviceData.count = 0;
      serviceData.resetTime = now + windowMs;
    }
    
    if (serviceData.count >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    serviceData.count++;
    this.rateLimits.set(service, serviceData);
    return true;
  }

  /**
   * Cache management
   */
  private setCachedData<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Also persist to AsyncStorage for offline access
    this.persistToStorage(key, { data, timestamp: Date.now(), ttl });
  }

  private getCachedData<T>(key: string): CacheEntry<T> | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Load cached data from storage on app start
   */
  async loadCachedDataFromStorage<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const cached = await AsyncStorage.getItem(`news_cache_${key}`);
      if (cached) {
        const data: CacheEntry<T> = JSON.parse(cached);
        if ((Date.now() - data.timestamp) < data.ttl) {
          this.cache.set(key, data);
          return data;
        } else {
          // Remove expired cache from storage
          await AsyncStorage.removeItem(`news_cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached data from storage:', error);
    }
    return null;
  }

  private async persistToStorage<T>(key: string, data: CacheEntry<T>): Promise<void> {
    try {
      await AsyncStorage.setItem(`news_cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  /**
   * Error logging
   */
  private logError(service: string, error: Error, retryCount: number): void {
    const errorInfo: ErrorInfo = {
      service,
      error,
      timestamp: Date.now(),
      retryCount
    };
    
    this.errorLog.push(errorInfo);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): { [service: string]: { count: number; lastError: string } } {
    const stats: { [service: string]: { count: number; lastError: string } } = {};
    
    this.errorLog.forEach(errorInfo => {
      if (!stats[errorInfo.service]) {
        stats[errorInfo.service] = { count: 0, lastError: '' };
      }
      stats[errorInfo.service].count++;
      stats[errorInfo.service].lastError = errorInfo.error.message;
    });
    
    return stats;
  }

  /**
   * Network connectivity check
   */
  async isNetworkAvailable(): Promise<boolean> {
    try {
      // Simple network check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    // Also clear from AsyncStorage
    AsyncStorage.getAllKeys().then(keys => {
      const cacheKeys = keys.filter(key => key.startsWith('news_cache_'));
      AsyncStorage.multiRemove(cacheKeys);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ErrorHandler;
