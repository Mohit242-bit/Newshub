import { Article, Category, ServiceResponse, FetchArticlesOptions } from '../types/Article';
import ErrorHandler from './errorHandler';
import { HTMLCleaner } from '../utils/htmlCleaner';
import { ArticleQualityFilter } from '../utils/articleQualityFilter';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid?: string;
  category?: string;
  'content:encoded'?: string;
  'media:content'?: {
    url: string;
  };
}

class IndianNewsService {
  private static instance: IndianNewsService;
  private errorHandler: ErrorHandler;
  
  // Popular Indian news RSS feeds - Updated with working URLs
  private rssFeeds = {
    // Primary sources
    ndtvIndia: 'https://feeds.feedburner.com/ndtvnews-india-news',
    ndtvLatest: 'https://feeds.feedburner.com/ndtvnews-latest',
    timesOfIndia: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    
    // Secondary sources (may have CORS issues)
    theHindu: 'https://www.thehindu.com/news/national/feeder/default.rss',
    indianExpress: 'https://indianexpress.com/section/india/feed/',
    hindustanTimes: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    
    // Tech and Business feeds
    timesOfIndiaTech: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', // Tech news
    timesOfIndiaBusiness: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
  };

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): IndianNewsService {
    if (!IndianNewsService.instance) {
      IndianNewsService.instance = new IndianNewsService();
    }
    return IndianNewsService.instance;
  }

  private async parseRSS(xmlText: string): Promise<RSSItem[]> {
    const items: RSSItem[] = [];
    
    try {
      // Extract items using regex - simplified parsing
      const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
      
      if (itemMatches) {
        for (const itemXml of itemMatches.slice(0, 25)) { // Get more items for variety
          const title = this.extractXmlContent(itemXml, 'title');
          const link = this.extractXmlContent(itemXml, 'link');
          const description = this.extractXmlContent(itemXml, 'description');
          const pubDate = this.extractXmlContent(itemXml, 'pubDate');
          const guid = this.extractXmlContent(itemXml, 'guid');
          
          if (title && link && description && pubDate) {
            items.push({
              title,
              link,
              description: this.cleanDescription(description),
              pubDate,
              guid: guid || link,
            });
          }
        }
      }
    } catch (error) {
      console.error('RSS parsing error:', error);
    }
    
    return items;
  }

  private extractXmlContent(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return match ? match[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
  }

  private cleanDescription(description: string): string {
    return HTMLCleaner.stripHtml(description);
  }

  private parseDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      console.warn('Date parsing error:', dateString);
      return new Date().toISOString();
    }
  }

  private transformArticle(rssItem: RSSItem, sourceName: string): Article {
    // Generate a unique ID without using Buffer (not available in React Native)
    const uniqueId = `indian_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: uniqueId,
      title: HTMLCleaner.cleanTitle(rssItem.title),
      description: HTMLCleaner.smartTruncate(rssItem.description || '', 180),
      content: rssItem['content:encoded'],
      url: rssItem.link,
      urlToImage: rssItem['media:content']?.url,
      author: sourceName,
      source: sourceName,
      publishedAt: this.parseDate(rssItem.pubDate),
      category: Category.INDIA,
      tags: ['india', 'indian-news', rssItem.category].filter(Boolean) as string[],
    };
  }

  private async fetchFromSource(feedUrl: string, sourceName: string): Promise<Article[]> {
    try {
      // Add timeout for RSS feeds - reduced for faster fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'NewsHub/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`${sourceName} RSS returned ${response.status}`);
        return [];
      }

      const xmlText = await response.text();
      
      // Check if response is actually XML/RSS
      if (!xmlText.includes('<item') && !xmlText.includes('<entry')) {
        console.warn(`${sourceName} returned non-RSS content`);
        return [];
      }
      
      const rssItems = await this.parseRSS(xmlText);
      
      if (rssItems.length === 0) {
        console.warn(`${sourceName} returned no valid articles`);
        return [];
      }
      
      return rssItems.map(item => this.transformArticle(item, sourceName));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`${sourceName} RSS feed timeout`);
      } else {
        console.warn(`${sourceName} RSS error:`, error.message);
      }
      return [];
    }
  }

  async fetchArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `indian_${options.category}_${options.page || 1}`;
    
    return this.errorHandler.executeWithRetry(
      async () => {
        // Fetch from multiple sources and combine
        const sources = [
          // Primary sources (more reliable)
          { url: this.rssFeeds.ndtvIndia, name: 'NDTV India' },
          { url: this.rssFeeds.ndtvLatest, name: 'NDTV Latest' },
          { url: this.rssFeeds.timesOfIndia, name: 'Times of India' },
          // Secondary sources
          { url: this.rssFeeds.theHindu, name: 'The Hindu' },
          { url: this.rssFeeds.indianExpress, name: 'Indian Express' },
        ];

        // Fetch from all sources in parallel
        const fetchPromises = sources.map(source => 
          this.fetchFromSource(source.url, source.name)
        );

        const results = await Promise.allSettled(fetchPromises);
        
        // Combine all successful results
        let allArticles: Article[] = [];
        let successfulSources = 0;
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.length > 0) {
            allArticles = allArticles.concat(result.value);
            successfulSources++;
            console.log(`✓ ${sources[index].name}: ${result.value.length} articles`);
          } else if (result.status === 'rejected') {
            console.warn(`✗ ${sources[index].name}: Failed`);
          }
        });

        console.log(`Indian News: ${successfulSources}/${sources.length} sources successful, ${allArticles.length} total articles`);

        // If no RSS feeds worked, return empty result (will trigger NewsAPI fallback)
        if (allArticles.length === 0) {
          console.warn('All Indian RSS feeds failed, using fallback');
          throw new Error('All RSS feeds failed');
        }

        // Sort by publication date (newest first)
        allArticles.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        // Remove duplicates based on title similarity
        let uniqueArticles = this.removeDuplicates(allArticles);
        
        // Apply quality filter to remove trash content
        uniqueArticles = ArticleQualityFilter.filterArticles(uniqueArticles);
        
        // Filter by quality score (minimum 40/100 for RSS feeds as they tend to have less metadata)
        uniqueArticles = ArticleQualityFilter.filterByQualityScore(uniqueArticles, 40);

        // Apply pagination
        const page = options.page || 1;
        const limit = options.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedArticles = uniqueArticles.slice(startIndex, endIndex);
        const hasMore = endIndex < uniqueArticles.length;

        return {
          data: paginatedArticles,
          source: 'Indian News RSS Feeds',
          timestamp: Date.now(),
          hasMore,
          totalResults: uniqueArticles.length,
        };
      },
      cacheKey,
      'indian-news'
    );
  }

  private removeDuplicates(articles: Article[]): Article[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().slice(0, 50); // Use first 50 chars for duplicate detection
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

export default IndianNewsService;
