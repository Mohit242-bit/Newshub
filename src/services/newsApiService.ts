import { Article, Category, ServiceResponse, FetchArticlesOptions } from '../types/Article';
import ErrorHandler from './errorHandler';
import { ArticleQualityFilter } from '../utils/articleQualityFilter';

interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

class NewsApiService {
  private static instance: NewsApiService;
  private errorHandler: ErrorHandler;
  private baseUrl = 'https://newsapi.org/v2';
  private apiKey = '74efa1095b4f4e66b201bc488ad62b01'; // Your NewsAPI key

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): NewsApiService {
    if (!NewsApiService.instance) {
      NewsApiService.instance = new NewsApiService();
    }
    return NewsApiService.instance;
  }

  private transformArticle(newsApiArticle: NewsAPIArticle, category: Category): Article {
    // Create more unique ID using URL hash or title hash
    const urlHash = newsApiArticle.url ? newsApiArticle.url.split('/').pop() || '' : '';
    const titleHash = newsApiArticle.title ? newsApiArticle.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) : '';
    const uniqueId = `newsapi_${urlHash}_${titleHash}_${Math.random().toString(36).substr(2, 5)}`;
    
    return {
      id: uniqueId,
      title: newsApiArticle.title,
      description: newsApiArticle.description || '',
      content: newsApiArticle.content || undefined,
      url: newsApiArticle.url,
      urlToImage: newsApiArticle.urlToImage || undefined,
      author: newsApiArticle.author || undefined,
      source: newsApiArticle.source.name,
      publishedAt: newsApiArticle.publishedAt,
      category,
      tags: [newsApiArticle.source.name],
    };
  }

  private getCategoryQuery(category: Category): string {
    // More specific and focused queries to get better quality results
    switch (category) {
      case Category.SOFTWARE:
        return '("software development" OR "programming" OR "JavaScript" OR "Python" OR "React" OR "AI" OR "machine learning") NOT (advertisement OR sponsored)';
      case Category.BREAKING:
        return '"breaking news" OR "just in" OR "latest update" NOT (click OR subscribe)';
      case Category.POLITICAL:
        return '("politics" OR "government" OR "election" OR "policy" OR "parliament") NOT (opinion OR editorial)';
      case Category.INDIA:
        return '("India" OR "Indian government" OR "Delhi" OR "Mumbai" OR "Bangalore") NOT (advertisement OR sponsored)';
      case Category.SPORTS:
        return '("sports" OR "football match" OR "cricket" OR "tennis" OR "basketball game") NOT (betting OR gambling)';
      case Category.BUSINESS:
        return '("business news" OR "stock market" OR "economy" OR "finance" OR "startup") NOT (advertisement OR sponsored)';
      case Category.WORLD:
        return '("world news" OR "international" OR "United Nations" OR "global") NOT (opinion OR sponsored)';
      case Category.TECH:
        return '("technology" OR "tech news" OR "gadget" OR "smartphone" OR "innovation") NOT (advertisement OR review)';
      case Category.AI_ML:
        return '("artificial intelligence" OR "machine learning" OR "deep learning" OR "ChatGPT" OR "neural network") NOT (course OR tutorial)';
      default:
        return '"news" NOT (advertisement OR sponsored OR click)';
    }
  }

  async fetchArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `newsapi_${options.category}_${options.page || 1}`;
    
    return this.errorHandler.executeWithRetry(
      async () => {
        const query = options.searchQuery || this.getCategoryQuery(options.category);
        const page = options.page || 1;
        const pageSize = Math.min(options.limit || 20, 100);
        
        const params = new URLSearchParams({
          'apiKey': this.apiKey,
          'q': query,
          'page': page.toString(),
          'pageSize': pageSize.toString(),
          'sortBy': options.sortBy === 'popularity' ? 'popularity' : 'publishedAt',
          'language': 'en'
        });

        const url = `${this.baseUrl}/everything?${params}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
        }

        const data: NewsAPIResponse = await response.json();
        
        if (data.status !== 'ok') {
          throw new Error('NewsAPI returned error status');
        }

        // Initial filter for basic validity
        const validArticles = data.articles.filter(article => 
          article.title && 
          article.description && 
          article.title !== '[Removed]' &&
          !article.title.toLowerCase().includes('removed') &&
          article.url &&
          !article.url.includes('removed.com')
        );

        // Transform articles
        let articles = validArticles.map(article => 
          this.transformArticle(article, options.category)
        );
        
        // Apply quality filter to remove trash content
        articles = ArticleQualityFilter.filterArticles(articles);
        
        // Filter by quality score (minimum 50/100)
        articles = ArticleQualityFilter.filterByQualityScore(articles, 50);

        const hasMore = articles.length === pageSize && data.totalResults > (page * pageSize);

        return {
          data: articles,
          source: 'NewsAPI.org',
          timestamp: Date.now(),
          hasMore,
          totalResults: data.totalResults,
        };
      },
      cacheKey,
      'newsapi'
    );
  }

  // Specialized method for breaking news using top headlines
  async fetchBreakingNews(limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `newsapi_breaking_headlines_${limit}`;
    
    return this.errorHandler.executeWithRetry(
      async () => {
        const params = new URLSearchParams({
          'apiKey': this.apiKey,
          'pageSize': Math.min(limit, 100).toString(),
          'country': 'us', // Can be changed to 'in' for India
          'category': 'general'
        });

        const url = `${this.baseUrl}/top-headlines?${params}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`NewsAPI Headlines error: ${response.status} ${response.statusText}`);
        }

        const data: NewsAPIResponse = await response.json();
        
        if (data.status !== 'ok') {
          throw new Error('NewsAPI Headlines returned error status');
        }

        const validArticles = data.articles.filter(article => 
          article.title && 
          article.description && 
          article.title !== '[Removed]'
        );

        const articles = validArticles.map(article => 
          this.transformArticle(article, Category.BREAKING)
        );

        return {
          data: articles,
          source: 'NewsAPI.org Breaking',
          timestamp: Date.now(),
          hasMore: false,
          totalResults: articles.length,
        };
      },
      cacheKey,
      'newsapi-breaking'
    );
  }
}

export default NewsApiService;
