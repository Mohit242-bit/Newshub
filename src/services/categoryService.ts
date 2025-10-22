import { Article, Category, ServiceResponse, FetchArticlesOptions } from '../types/Article';
import DevToService from './devToService';
import HackerNewsService from './hackerNewsService';
import GuardianService from './guardianService';
import ESPNService from './espnService';
import IndianNewsService from './indianNewsService';
import NewsApiService from './newsApiService';
import ErrorHandler from './errorHandler';
import { ensureSourceDiversity, mixRecentAndPopular, combineAndDiversifyArticles } from '../utils/articleDiversity';

class CategoryService {
  private static instance: CategoryService;
  private errorHandler = ErrorHandler.getInstance();

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  async getArticles(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const options: FetchArticlesOptions = {
      category,
      limit,
      page: 1,
      sortBy: 'publishedAt'
    };

    switch (category) {
      case Category.SOFTWARE:
        return this.getSoftwareArticles(limit);
      case Category.TECH:
        return this.getTechArticles(options);
      case Category.AI_ML:
        return this.getAIMLArticles(options);
      case Category.WEB_DEV:
        return this.getWebDevArticles(options);
      case Category.MOBILE_DEV:
        return this.getMobileDevArticles(options);
      case Category.BREAKING:
        return this.getBreakingNews(options);
      case Category.POLITICAL:
        return this.getPoliticalNews(options);
      case Category.INDIA:
        return this.getIndianNews(options);
      case Category.SPORTS:
        return this.getSportsNews(options);
      case Category.BUSINESS:
        return this.getBusinessNews(options);
      case Category.WORLD:
        return this.getWorldNews(options);
      case Category.SCIENCE:
        return this.getScienceNews(options);
      case Category.STARTUPS:
        return this.getStartupNews(options);
      case Category.ALL:
      default:
        return this.getAllNews(limit);
    }
  }

  private async getSoftwareArticles(limit: number): Promise<ServiceResponse<Article[]>> {
    // Fetch from multiple sources in parallel for better variety
    const sources = [
      DevToService.getInstance().fetchArticles(Math.ceil(limit / 2), 1),
      HackerNewsService.getInstance().fetchTopStories(Math.ceil(limit / 3)),
      NewsApiService.getInstance().fetchArticles({
        category: Category.SOFTWARE,
        limit: Math.ceil(limit / 2),
        searchQuery: 'programming OR software development OR coding OR github OR open source OR javascript OR python OR react',
        sortBy: 'publishedAt'
      })
    ];

    try {
      // Execute all sources in parallel
      const results = await Promise.allSettled(sources);
      const articleArrays: Article[][] = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          articleArrays.push(result.value.data);
        }
      });

      // Combine and diversify
      const combinedArticles = combineAndDiversifyArticles(articleArrays, limit);
      
      return {
        data: combinedArticles,
        source: 'Dev.to + HackerNews + Tech News',
        timestamp: Date.now(),
        hasMore: combinedArticles.length === limit,
        totalResults: combinedArticles.length,
      };
    } catch (error) {
      // Fallback to cached data or empty
      return {
        data: [],
        source: 'Software (Offline)',
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  private async getBreakingNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Primary: NewsAPI breaking headlines; Fallbacks: Guardian, Indian news
    const primary = () => NewsApiService.getInstance().fetchBreakingNews(options.limit || 20);
    const fallback1 = () => GuardianService.getInstance().fetchArticles(options);
    const fallback2 = () => IndianNewsService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback1, fallback2],
      `category_breaking_${options.limit}`,
      'CategoryBreaking'
    );
  }

  private async getPoliticalNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Use NewsAPI for political news as primary (more reliable)
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'politics OR government OR election OR policy OR political'
    });
    const fallback = () => IndianNewsService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_political_${options.limit}`,
      'CategoryPolitical'
    );
  }

  private async getIndianNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Primary: NewsAPI India-specific queries
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'India OR Delhi OR Mumbai OR Bangalore OR Chennai OR Kolkata OR Indian OR Modi OR Bollywood'
    });
    
    // Fallback 1: Indian RSS news sources
    const fallback1 = () => IndianNewsService.getInstance().fetchArticles(options);
    
    // Fallback 2: Guardian India section
    const fallback2 = () => GuardianService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback1, fallback2],
      `category_india_${options.limit}`,
      'CategoryIndia'
    );
  }

  private async getSportsNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Primary: NewsAPI sports coverage
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'sports OR cricket OR football OR basketball OR tennis OR soccer OR hockey OR baseball OR golf'
    });
    
    // Fallback 1: ESPN RSS feed
    const fallback1 = () => ESPNService.getInstance().fetchArticles(options);
    
    // Fallback 2: Guardian sports section
    const fallback2 = () => GuardianService.getInstance().fetchArticles({
      ...options,
      category: Category.SPORTS
    });

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback1, fallback2],
      `category_sports_${options.limit}`,
      'CategorySports'
    );
  }

  private async getBusinessNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Use NewsAPI for business news as primary (more reliable)
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'business OR finance OR economy OR stock OR market OR startup'
    });
    const fallback = () => IndianNewsService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_business_${options.limit}`,
      'CategoryBusiness'
    );
  }

  private async getWorldNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Use NewsAPI for world news as primary (more reliable)
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'world OR international OR global OR countries'
    });
    const fallback = () => IndianNewsService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_world_${options.limit}`,
      'CategoryWorld'
    );
  }

  private async getTechArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Parallel fetch from multiple sources for variety
    const sources = [
      NewsApiService.getInstance().fetchArticles({
        ...options,
        limit: Math.ceil((options.limit || 20) / 2),
        searchQuery: 'technology OR Microsoft OR Google OR Apple OR Amazon OR startup OR innovation OR gadget OR smartphone'
      }),
      GuardianService.getInstance().fetchArticles({
        ...options,
        limit: Math.ceil((options.limit || 20) / 3)
      }),
      DevToService.getInstance().fetchArticles(Math.ceil((options.limit || 20) / 3), 1)
    ];

    try {
      const results = await Promise.allSettled(sources);
      const articleArrays: Article[][] = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          articleArrays.push(result.value.data);
        }
      });

      const combinedArticles = combineAndDiversifyArticles(articleArrays, options.limit || 20);
      
      return {
        data: combinedArticles,
        source: 'Tech News Mix',
        timestamp: Date.now(),
        hasMore: combinedArticles.length === (options.limit || 20),
        totalResults: combinedArticles.length,
      };
    } catch (error) {
      return {
        data: [],
        source: 'Tech (Offline)',
        timestamp: Date.now(),
        hasMore: false,
        totalResults: 0,
      };
    }
  }

  private async getAIMLArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // AI/ML focused articles
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'artificial intelligence OR machine learning OR AI OR ML OR neural networks OR deep learning'
    });
    const fallback = () => DevToService.getInstance().fetchArticles(options.limit || 20, 1);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_aiml_${options.limit}`,
      'CategoryAIML'
    );
  }

  private async getWebDevArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Web development focused
    const primary = () => DevToService.getInstance().fetchArticles(options.limit || 20, 1);
    const fallback = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'web development OR frontend OR backend OR React OR Angular OR Vue OR JavaScript'
    });

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_webdev_${options.limit}`,
      'CategoryWebDev'
    );
  }

  private async getMobileDevArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Mobile development focused
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'mobile development OR iOS OR Android OR React Native OR Flutter OR Swift OR Kotlin'
    });
    const fallback = () => DevToService.getInstance().fetchArticles(options.limit || 20, 1);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_mobiledev_${options.limit}`,
      'CategoryMobileDev'
    );
  }

  private async getScienceNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Science news
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'science OR research OR scientific OR discovery OR study'
    });
    const fallback = () => GuardianService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_science_${options.limit}`,
      'CategoryScience'
    );
  }

  private async getStartupNews(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    // Startup and entrepreneurship news
    const primary = () => NewsApiService.getInstance().fetchArticles({
      ...options,
      searchQuery: 'startup OR entrepreneur OR funding OR venture capital OR IPO'
    });
    const fallback = () => GuardianService.getInstance().fetchArticles(options);

    return this.errorHandler.executeWithFallback(
      primary,
      [fallback],
      `category_startups_${options.limit}`,
      'CategoryStartups'
    );
  }

  private async getAllNews(limit: number): Promise<ServiceResponse<Article[]>> {
    // Combine articles from different categories
    const categoryPromises = [
      this.getSoftwareArticles(Math.ceil(limit / 3)),
      this.getIndianNews({ category: Category.INDIA, limit: Math.ceil(limit / 3) }),
      this.getSportsNews({ category: Category.SPORTS, limit: Math.ceil(limit / 3) }),
      this.getWorldNews({ category: Category.WORLD, limit: Math.ceil(limit / 4) }),
      this.getTechArticles({ category: Category.TECH, limit: Math.ceil(limit / 4) }),
    ];

    const results = await Promise.allSettled(categoryPromises);
    const articleArrays: Article[][] = [];
    let combinedSource = 'Multiple Sources';

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data.length > 0) {
        articleArrays.push(result.value.data);
      }
    });

    // Combine and diversify articles
    const diversifiedArticles = combineAndDiversifyArticles(articleArrays, limit);
    
    // Mix recent and popular for variety
    const finalArticles = mixRecentAndPopular(diversifiedArticles);

    return {
      data: finalArticles,
      source: combinedSource,
      timestamp: Date.now(),
      hasMore: finalArticles.length === limit,
      totalResults: finalArticles.length,
    };
  }
}

export default CategoryService;
