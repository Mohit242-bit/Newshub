import { Article, Category, ServiceResponse } from '../types/Article';
import ErrorHandler from './errorHandler';
import { ArticleQualityFilter } from '../utils/articleQualityFilter';

export interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  cover_image?: string;
  social_image?: string;
  user: {
    name: string;
    username: string;
  };
  published_at: string;
  tag_list: string[];
  reading_time_minutes: number;
  body_markdown?: string;
}

class DevToService {
  private static instance: DevToService;
  private baseUrl = 'https://dev.to/api';
  private errorHandler = ErrorHandler.getInstance();

  public static getInstance(): DevToService {
    if (!DevToService.instance) {
      DevToService.instance = new DevToService();
    }
    return DevToService.instance;
  }

  async fetchArticles(limit: number = 20, page: number = 1): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `devto_articles_${limit}_${page}`;
    
    const primaryCall = async (): Promise<ServiceResponse<Article[]>> => {
      const params = new URLSearchParams({
        per_page: limit.toString(),
        page: page.toString(),
        state: 'fresh'
      });

      const response = await fetch(`${this.baseUrl}/articles?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsHub-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.status} ${response.statusText}`);
      }

      const data: DevToArticle[] = await response.json();
      let articles = this.transformArticles(data);
      
      // Apply quality filter to Dev.to articles
      articles = ArticleQualityFilter.filterArticles(articles);
      
      return {
        data: articles,
        source: 'Dev.to',
        timestamp: Date.now(),
        hasMore: data.length === limit,
        totalResults: data.length
      };
    };

    // Fallback to trending articles if fresh fails
    const fallbackCall = async (): Promise<ServiceResponse<Article[]>> => {
      const response = await fetch(`${this.baseUrl}/articles?per_page=${limit}&page=${page}&top=7`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsHub-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Dev.to trending API error: ${response.status}`);
      }

      const data: DevToArticle[] = await response.json();
      const articles = this.transformArticles(data);
      
      return {
        data: articles,
        source: 'Dev.to (Trending)',
        timestamp: Date.now(),
        hasMore: data.length === limit,
        totalResults: data.length
      };
    };

    return this.errorHandler.executeWithFallback(
      primaryCall,
      [fallbackCall],
      cacheKey,
      'Dev.to'
    );
  }

  async searchArticles(query: string, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `devto_search_${query}_${limit}`;
    
    const searchCall = async (): Promise<ServiceResponse<Article[]>> => {
      const params = new URLSearchParams({
        per_page: limit.toString(),
        state: 'fresh'
      });

      // Dev.to doesn't have direct search, so we filter by tags if query matches common tech terms
      const techTags = ['javascript', 'python', 'react', 'nodejs', 'typescript', 'ai', 'machine learning'];
      const matchingTag = techTags.find(tag => query.toLowerCase().includes(tag));
      
      if (matchingTag) {
        params.append('tag', matchingTag);
      }

      const response = await fetch(`${this.baseUrl}/articles?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsHub-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Dev.to search error: ${response.status}`);
      }

      const data: DevToArticle[] = await response.json();
      let articles = this.transformArticles(data);
      
      // Client-side filtering for better search results
      if (!matchingTag) {
        articles = articles.filter(article => 
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.description.toLowerCase().includes(query.toLowerCase()) ||
          article.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
      }
      
      return {
        data: articles,
        source: 'Dev.to Search',
        timestamp: Date.now(),
        hasMore: false,
        totalResults: articles.length
      };
    };

    return this.errorHandler.executeWithFallback(
      searchCall,
      [],
      cacheKey,
      'Dev.to Search'
    );
  }

  private transformArticles(devToArticles: DevToArticle[]): Article[] {
    return devToArticles.map(article => ({
      id: `devto_${article.id}_${Date.now()}`,
      title: article.title,
      description: article.description || '',
      content: article.body_markdown,
      url: article.url,
      urlToImage: article.cover_image || article.social_image,
      author: article.user.name,
      source: 'Dev.to',
      publishedAt: article.published_at,
      category: Category.SOFTWARE,
      readTime: article.reading_time_minutes,
      tags: article.tag_list
    }));
  }

  async getArticleDetails(articleId: string): Promise<DevToArticle | null> {
    try {
      const numericId = articleId.replace('devto_', '');
      const response = await fetch(`${this.baseUrl}/articles/${numericId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsHub-App/1.0'
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch Dev.to article details:', error);
      return null;
    }
  }
}

export default DevToService;
