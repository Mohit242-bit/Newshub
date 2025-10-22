import { Article, Category, ServiceResponse } from '../types/Article';
import ErrorHandler from './errorHandler';
import { ArticleQualityFilter } from '../utils/articleQualityFilter';

export interface HackerNewsItem {
  id: number;
  title?: string;
  url?: string;
  text?: string;
  by?: string;
  time?: number;
  score?: number;
  descendants?: number;
  type: 'story' | 'comment' | 'ask' | 'show' | 'job' | 'poll';
}

class HackerNewsService {
  private static instance: HackerNewsService;
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';
  private errorHandler = ErrorHandler.getInstance();

  public static getInstance(): HackerNewsService {
    if (!HackerNewsService.instance) {
      HackerNewsService.instance = new HackerNewsService();
    }
    return HackerNewsService.instance;
  }

  async fetchTopStories(limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `hn_top_${limit}`;
    
    const primaryCall = async (): Promise<ServiceResponse<Article[]>> => {
      // Get top story IDs
      const storiesResponse = await fetch(`${this.baseUrl}/topstories.json`);
      if (!storiesResponse.ok) {
        throw new Error(`HN topstories error: ${storiesResponse.status}`);
      }
      
      const storyIds: number[] = await storiesResponse.json();
      const limitedIds = storyIds.slice(0, limit);
      
      // Fetch story details in parallel (but limit concurrent requests)
      const batchSize = 10;
      const articles: Article[] = [];
      
      for (let i = 0; i < limitedIds.length; i += batchSize) {
        const batch = limitedIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.fetchStoryDetails(id));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            articles.push(result.value);
          }
        });
      }
      
      // Apply quality filter to HackerNews articles
      const filteredArticles = ArticleQualityFilter.filterArticles(articles);
      
      return {
        data: filteredArticles,
        source: 'Hacker News',
        timestamp: Date.now(),
        hasMore: storyIds.length > limit,
        totalResults: articles.length
      };
    };

    const fallbackCall = async (): Promise<ServiceResponse<Article[]>> => {
      // Fallback to new stories if top stories fail
      const storiesResponse = await fetch(`${this.baseUrl}/newstories.json`);
      if (!storiesResponse.ok) {
        throw new Error(`HN newstories error: ${storiesResponse.status}`);
      }
      
      const storyIds: number[] = await storiesResponse.json();
      const limitedIds = storyIds.slice(0, limit);
      
      const articles: Article[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < limitedIds.length; i += batchSize) {
        const batch = limitedIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.fetchStoryDetails(id));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            articles.push(result.value);
          }
        });
      }
      
      return {
        data: articles,
        source: 'Hacker News (New)',
        timestamp: Date.now(),
        hasMore: storyIds.length > limit,
        totalResults: articles.length
      };
    };

    return this.errorHandler.executeWithFallback(
      primaryCall,
      [fallbackCall],
      cacheKey,
      'HackerNews'
    );
  }

  async fetchShowStories(limit: number = 20): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `hn_show_${limit}`;
    
    const showCall = async (): Promise<ServiceResponse<Article[]>> => {
      const storiesResponse = await fetch(`${this.baseUrl}/showstories.json`);
      if (!storiesResponse.ok) {
        throw new Error(`HN showstories error: ${storiesResponse.status}`);
      }
      
      const storyIds: number[] = await storiesResponse.json();
      const limitedIds = storyIds.slice(0, limit);
      
      const articles: Article[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < limitedIds.length; i += batchSize) {
        const batch = limitedIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.fetchStoryDetails(id));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            articles.push(result.value);
          }
        });
      }
      
      return {
        data: articles,
        source: 'Hacker News Show',
        timestamp: Date.now(),
        hasMore: storyIds.length > limit,
        totalResults: articles.length
      };
    };

    return this.errorHandler.executeWithFallback(
      showCall,
      [],
      cacheKey,
      'HackerNews Show'
    );
  }

  private async fetchStoryDetails(id: number): Promise<Article | null> {
    try {
      const response = await fetch(`${this.baseUrl}/item/${id}.json`);
      if (!response.ok) {
        return null;
      }
      
      const item: HackerNewsItem = await response.json();
      
      // Only process stories with titles
      if (!item.title || item.type !== 'story') {
        return null;
      }
      
      return this.transformToArticle(item);
    } catch (error) {
      console.warn(`Failed to fetch HN story ${id}:`, error);
      return null;
    }
  }

  private transformToArticle(item: HackerNewsItem): Article {
    const publishedAt = item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString();
    
    // Extract description from text or generate from title
    let description = '';
    if (item.text) {
      // Remove HTML tags and truncate
      description = item.text.replace(/<[^>]*>/g, '').slice(0, 200);
    } else {
      description = `Hacker News discussion: ${item.title}`;
    }
    
    // Determine if it's a Show HN, Ask HN, or regular story
    let category = Category.SOFTWARE;
    const title = item.title || '';
    if (title.startsWith('Show HN:')) {
      description = `Show HN: ${description}`;
    } else if (title.startsWith('Ask HN:')) {
      description = `Ask HN: ${description}`;
    }

    return {
      id: `hn_${item.id}_${Date.now()}`,
      title: title,
      description,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      author: item.by || 'Anonymous',
      source: 'Hacker News',
      publishedAt,
      category,
      tags: this.extractTags(title)
    };
  }

  private extractTags(title: string): string[] {
    const tags: string[] = [];
    const lowerTitle = title.toLowerCase();
    
    // Common tech terms that might be in HN titles
    const techKeywords = [
      'javascript', 'js', 'python', 'rust', 'go', 'golang', 'react', 'vue', 'angular',
      'ai', 'ml', 'machine learning', 'startup', 'opensource', 'crypto', 'blockchain',
      'security', 'privacy', 'database', 'web', 'mobile', 'ios', 'android', 'linux'
    ];
    
    techKeywords.forEach(keyword => {
      if (lowerTitle.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    if (title.startsWith('Show HN:')) tags.push('show-hn');
    if (title.startsWith('Ask HN:')) tags.push('ask-hn');
    
    return tags;
  }

  async searchStories(query: string, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    // HN doesn't have built-in search, so we'll fetch top stories and filter
    const cacheKey = `hn_search_${query}_${limit}`;
    
    const searchCall = async (): Promise<ServiceResponse<Article[]>> => {
      const topStories = await this.fetchTopStories(100); // Get more to filter from
      
      const filteredArticles = topStories.data.filter(article =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit);
      
      return {
        data: filteredArticles,
        source: 'Hacker News Search',
        timestamp: Date.now(),
        hasMore: false,
        totalResults: filteredArticles.length
      };
    };

    return this.errorHandler.executeWithFallback(
      searchCall,
      [],
      cacheKey,
      'HackerNews Search'
    );
  }
}

export default HackerNewsService;
