import { Article, Category, ServiceResponse, FetchArticlesOptions } from '../types/Article';
import ErrorHandler from './errorHandler';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid?: string;
  category?: string;
  'content:encoded'?: string;
  'media:thumbnail'?: {
    url: string;
  };
}

interface RSSFeed {
  rss: {
    channel: {
      title: string;
      description: string;
      item: RSSItem[];
    };
  };
}

class ESPNService {
  private static instance: ESPNService;
  private errorHandler: ErrorHandler;
  private rssFeeds = {
    general: 'https://www.espn.com/espn/rss/news',
    nfl: 'https://www.espn.com/espn/rss/nfl/news',
    nba: 'https://www.espn.com/espn/rss/nba/news',
    soccer: 'https://www.espn.com/espn/rss/soccer/news',
    cricket: 'https://www.espn.com/espn/rss/cricket/news',
  };

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): ESPNService {
    if (!ESPNService.instance) {
      ESPNService.instance = new ESPNService();
    }
    return ESPNService.instance;
  }

  private async parseRSS(xmlText: string): Promise<RSSItem[]> {
    // Simple RSS parsing - in production, consider using a proper XML parser
    const items: RSSItem[] = [];
    
    try {
      // Extract items using regex - simplified parsing
      const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
      
      if (itemMatches) {
        for (const itemXml of itemMatches.slice(0, 20)) { // Limit to 20 items
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
    // Remove HTML tags and decode entities
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#[0-9]+;/g, '')
      .trim();
  }

  private parseDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      console.warn('ESPN date parsing error:', dateString);
      return new Date().toISOString();
    }
  }

  private transformArticle(rssItem: RSSItem): Article {
    // Generate unique ID without Buffer (not available in React Native)
    const uniqueId = `espn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: uniqueId,
      title: rssItem.title,
      description: rssItem.description || '',
      content: rssItem['content:encoded'],
      url: rssItem.link,
      urlToImage: rssItem['media:thumbnail']?.url,
      author: 'ESPN',
      source: 'ESPN',
      publishedAt: this.parseDate(rssItem.pubDate),
      category: Category.SPORTS,
      tags: ['sports', rssItem.category].filter(Boolean) as string[],
    };
  }

  private getFeedUrl(category: Category): string {
    // For now, just return general sports feed
    // Could be expanded to return specific feeds based on category
    return this.rssFeeds.general;
  }

  async fetchArticles(options: FetchArticlesOptions): Promise<ServiceResponse<Article[]>> {
    const cacheKey = `espn_${options.category}_${options.page || 1}`;
    
    return this.errorHandler.executeWithRetry(
      async () => {
        const feedUrl = this.getFeedUrl(options.category);
        
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'NewsHub/1.0',
          },
        });
        
        if (!response.ok) {
          throw new Error(`ESPN RSS error: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const rssItems = await this.parseRSS(xmlText);
        
        // Apply pagination manually
        const page = options.page || 1;
        const limit = options.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedItems = rssItems.slice(startIndex, endIndex);
        const articles = paginatedItems.map(item => this.transformArticle(item));
        
        const hasMore = endIndex < rssItems.length;

        return {
          data: articles,
          source: 'ESPN RSS',
          timestamp: Date.now(),
          hasMore,
          totalResults: rssItems.length,
        };
      },
      cacheKey,
      'espn'
    );
  }
}

export default ESPNService;
