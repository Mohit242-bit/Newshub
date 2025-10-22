import { Article, Category, ServiceResponse, FetchArticlesOptions } from '../types/Article';
import ErrorHandler from './errorHandler';

interface GuardianArticle {
  id: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  webPublicationDate: string;
  fields?: {
    headline?: string;
    standfirst?: string;
    body?: string;
    thumbnail?: string;
    byline?: string;
    trailText?: string;
  };
  sectionName: string;
}

interface GuardianResponse {
  response: {
    status: string;
    userTier: string;
    total: number;
    startIndex: number;
    pageSize: number;
    currentPage: number;
    pages: number;
    orderBy: string;
    results: GuardianArticle[];
  };
}

class GuardianService {
  private static instance: GuardianService;
  private errorHandler: ErrorHandler;
  private baseUrl = 'https://content.guardianapis.com';

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): GuardianService {
    if (!GuardianService.instance) {
      GuardianService.instance = new GuardianService();
    }
    return GuardianService.instance;
  }

  private transformArticle(guardianArticle: GuardianArticle, category: Category): Article {
    return {
      id: `guardian_${guardianArticle.id}_${Date.now()}`,
      title: guardianArticle.webTitle,
      description: guardianArticle.fields?.standfirst || guardianArticle.fields?.trailText || '',
      content: guardianArticle.fields?.body,
      url: guardianArticle.webUrl,
      urlToImage: guardianArticle.fields?.thumbnail,
      author: guardianArticle.fields?.byline,
      source: 'The Guardian',
      publishedAt: guardianArticle.webPublicationDate,
      category,
      tags: [guardianArticle.sectionName],
    };
  }

  private getSectionForCategory(category: Category): string {
    switch (category) {
      case Category.POLITICAL:
        return 'politics';
      case Category.WORLD:
        return 'world';
      case Category.BUSINESS:
        return 'business';
      case Category.SPORTS:
        return 'sport';
      case Category.SCIENCE:
        return 'science';
      case Category.TECH:
        return 'technology';
      case Category.INDIA:
        return 'world/india';
      default:
        return 'world';
    }
  }

  async fetchArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `guardian_${options.category}_${options.page || 1}`;
    
    return this.errorHandler.executeWithRetry(
      async () => {
        const section = this.getSectionForCategory(options.category);
        const page = options.page || 1;
        const pageSize = Math.min(options.limit || 20, 50);
        
        // Using a test Guardian API key (this may not work in production)
        const apiKey = 'test'; // Guardian API key - replace with valid key
        const params = new URLSearchParams({
          'api-key': apiKey,
          'section': section,
          'page': page.toString(),
          'page-size': pageSize.toString(),
          'show-fields': 'headline,standfirst,body,thumbnail,byline,trailText',
          'order-by': 'newest'
        });

        const url = `${this.baseUrl}/search?${params}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Guardian API error: ${response.status} ${response.statusText}`);
        }

        const data: GuardianResponse = await response.json();
        
        if (data.response.status !== 'ok') {
          throw new Error('Guardian API returned error status');
        }

        const articles = data.response.results.map(article => 
          this.transformArticle(article, options.category)
        );

        const hasMore = data.response.currentPage < data.response.pages;

        return {
          data: articles,
          source: 'The Guardian API',
          timestamp: Date.now(),
          hasMore,
          totalResults: data.response.total,
        };
      },
      cacheKey,
      'guardian'
    );
  }
}

export default GuardianService;
