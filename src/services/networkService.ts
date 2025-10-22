import { Category, ServiceResponse, Article } from '../types/Article';
import CategoryService from './categoryService';
import MockDataService from './mockDataService';
import { isInDemoMode, shouldBypassNetwork, getNetworkTimeout, shouldLogVerbose } from '../config/developmentConfig';

class NetworkService {
  private static instance: NetworkService;
  private categoryService = CategoryService.getInstance();
  private mockDataService = MockDataService.getInstance();
  private isNetworkAvailable: boolean = true;
  private networkCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.startNetworkMonitoring();
  }

  /**
   * Get articles with smart demo/network prioritization for development
   */
  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    if (shouldLogVerbose()) {
      console.log(`🎯 Fetching ${category} articles (demoMode: ${isInDemoMode()}, bypassNetwork: ${shouldBypassNetwork()})`);
    }
    
    // In development, prioritize demo data for faster loading
    if (isInDemoMode()) {
      try {
        if (shouldLogVerbose()) {
          console.log(`🚀 Demo mode: Loading ${category} articles instantly`);
        }
        
        const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
        
        // Add a small delay to simulate realistic loading
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
          ...mockResult,
          source: `${mockResult.source} (Development Mode)`
        };
      } catch (error) {
        if (shouldLogVerbose()) {
          console.warn('Demo data failed, trying network:', error);
        }
      }
    }
    
    // Skip network entirely if in demo-only mode
    if (shouldBypassNetwork()) {
      const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
      return {
        ...mockResult,
        source: `${mockResult.source} (Demo Only Mode)`
      };
    }
    
    try {
      if (shouldLogVerbose()) {
        console.log(`🌐 Attempting network fetch for ${category} (timeout: ${getNetworkTimeout()}ms)`);
      }
      
      // Try real data with development-friendly timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), getNetworkTimeout());
      });

      const dataPromise = this.categoryService.getArticles(category, limit);
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      if (result.data && result.data.length > 0) {
        this.isNetworkAvailable = true;
        if (shouldLogVerbose()) {
          console.log(`✅ Network success: ${result.data.length} articles`);
        }
        return result;
      }
      
      throw new Error('Empty network response');
      
    } catch (error) {
      if (shouldLogVerbose()) {
        console.warn(`❌ Network failed for ${category}, using demo:`, error.message);
      }
      
      this.isNetworkAvailable = false;
      
      // Final fallback to mock data
      const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
      return {
        ...mockResult,
        source: `${mockResult.source} (Network Failed - Demo Fallback)`
      };
    }
  }

  /**
   * Check if network is currently available
   */
  getNetworkStatus(): boolean {
    return this.isNetworkAvailable;
  }

  /**
   * Force refresh network status
   */
  async checkNetworkStatus(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Try a simple HTTP request to test connectivity
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      this.isNetworkAvailable = response.ok;
      
      console.log(`🌐 Network status check: ${this.isNetworkAvailable ? 'Available' : 'Unavailable'}`);
      return this.isNetworkAvailable;
      
    } catch (error) {
      this.isNetworkAvailable = false;
      console.log(`🌐 Network status check: Unavailable (${error.message})`);
      return false;
    }
  }

  /**
   * Start monitoring network status
   */
  private startNetworkMonitoring(): void {
    // Check network status every 30 seconds
    this.networkCheckInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, 30000);

    // Initial check
    this.checkNetworkStatus();
  }

  /**
   * Stop network monitoring
   */
  stopNetworkMonitoring(): void {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
  }

  /**
   * Manual refresh - try network first, fallback to mock
   */
  async refreshArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    console.log(`🔄 Manual refresh requested for ${category}`);
    
    // Force network status check
    await this.checkNetworkStatus();
    
    if (this.isNetworkAvailable) {
      try {
        const result = await this.categoryService.getArticles(category, limit);
        
        if (result.data && result.data.length > 0) {
          console.log(`✅ Refresh successful: ${result.data.length} articles`);
          return result;
        }
      } catch (error) {
        console.warn('Refresh failed, using mock data:', error);
      }
    }

    // If network is unavailable or failed, use mock data
    const mockResult = await this.mockDataService.getMockArticlesAsync(category, limit);
    return {
      ...mockResult,
      source: `${mockResult.source} (Refreshed - Network Unavailable)`
    };
  }

  /**
   * Get demo data directly (for testing)
   */
  async getDemoArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    console.log(`📱 Providing demo data for ${category}`);
    return await this.mockDataService.getMockArticlesAsync(category, limit);
  }
}

export default NetworkService;