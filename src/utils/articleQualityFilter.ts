import { Article } from '../types/Article';

/**
 * Advanced Article Quality Filter
 * Filters out trash, irrelevant, and low-quality articles
 */
export class ArticleQualityFilter {
  // Blacklisted domains that often have low-quality content
  private static readonly BLACKLISTED_DOMAINS = [
    'removed.com',
    'example.com',
    'test.com',
    'localhost',
  ];

  // Keywords that indicate low-quality or irrelevant content
  private static readonly TRASH_KEYWORDS = [
    '[removed]',
    '[deleted]',
    'test article',
    'lorem ipsum',
    'undefined',
    'null',
    'page not found',
    '404 error',
    '403 forbidden',
    'access denied',
    'subscribe to read',
    'content not available',
    'click here',
    'download now',
    'sponsored content',
    'advertisement',
  ];

  // Minimum quality thresholds
  private static readonly MIN_TITLE_LENGTH = 10;
  private static readonly MAX_TITLE_LENGTH = 300;
  private static readonly MIN_DESCRIPTION_LENGTH = 20;
  private static readonly MAX_DESCRIPTION_LENGTH = 500;

  /**
   * Check if an article meets quality standards
   */
  static isQualityArticle(article: Article): boolean {
    if (!article) return false;

    // Check basic requirements
    if (!this.hasValidTitle(article.title)) return false;
    if (!this.hasValidDescription(article.description)) return false;
    if (!this.hasValidUrl(article.url)) return false;
    if (!this.hasValidDate(article.publishedAt)) return false;
    
    // Check for trash content
    if (this.containsTrashContent(article)) return false;
    
    // Check for duplicate/repetitive content
    if (this.isDuplicateContent(article)) return false;
    
    return true;
  }

  /**
   * Filter and clean a list of articles
   */
  static filterArticles(articles: Article[]): Article[] {
    if (!articles || !Array.isArray(articles)) return [];

    // First pass: filter out obvious trash
    let filtered = articles.filter(article => this.isQualityArticle(article));

    // Second pass: remove near-duplicates
    filtered = this.removeSimilarArticles(filtered);

    // Third pass: clean up content
    filtered = filtered.map(article => this.cleanArticle(article));

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    return filtered;
  }

  /**
   * Check if title is valid
   */
  private static hasValidTitle(title: string): boolean {
    if (!title || typeof title !== 'string') return false;
    
    const cleaned = title.trim();
    if (cleaned.length < this.MIN_TITLE_LENGTH) return false;
    if (cleaned.length > this.MAX_TITLE_LENGTH) return false;
    
    // Check for all caps (usually spam)
    if (cleaned === cleaned.toUpperCase() && cleaned.length > 20) return false;
    
    // Check for excessive special characters
    const specialCharCount = (cleaned.match(/[!@#$%^&*()+=\[\]{}|\\:;"'<>?,./]/g) || []).length;
    if (specialCharCount > cleaned.length * 0.3) return false;
    
    // Check for repeated characters (e.g., "!!!!!!")
    if (/(.)\1{4,}/.test(cleaned)) return false;
    
    return true;
  }

  /**
   * Check if description is valid
   */
  private static hasValidDescription(description: string): boolean {
    if (!description || typeof description !== 'string') return false;
    
    const cleaned = description.trim();
    if (cleaned.length < this.MIN_DESCRIPTION_LENGTH) return false;
    if (cleaned.length > this.MAX_DESCRIPTION_LENGTH) return false;
    
    // Check if description is just a repeat of the title
    if (cleaned.length < 50 && cleaned.toLowerCase().includes('click')) return false;
    
    return true;
  }

  /**
   * Check if URL is valid
   */
  private static hasValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      
      // Check for blacklisted domains
      const hostname = urlObj.hostname.toLowerCase();
      if (this.BLACKLISTED_DOMAINS.some(domain => hostname.includes(domain))) {
        return false;
      }
      
      // Check for valid protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if date is valid and recent
   */
  private static hasValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      
      // Check if date is not in the future
      const now = new Date();
      if (date > now) {
        // Allow up to 1 hour in the future (timezone issues)
        const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);
        if (date > oneHourAhead) return false;
      }
      
      // Check if date is not too old (30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (date < thirtyDaysAgo) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if article contains trash content
   */
  private static containsTrashContent(article: Article): boolean {
    const combinedText = `${article.title} ${article.description}`.toLowerCase();
    
    // Check for trash keywords
    for (const keyword of this.TRASH_KEYWORDS) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    // Check for excessive emojis (spam indicator)
    const emojiCount = (combinedText.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length;
    if (emojiCount > 5) return true;
    
    // Check for URL shorteners in title (often spam)
    const urlShorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly'];
    if (urlShorteners.some(shortener => combinedText.includes(shortener))) {
      return true;
    }
    
    return false;
  }

  /**
   * Check for duplicate content patterns
   */
  private static isDuplicateContent(article: Article): boolean {
    // Check if title and description are identical
    if (article.title === article.description) return true;
    
    // Check if description is just title with minor additions
    const titleWords = article.title.toLowerCase().split(/\s+/);
    const descWords = article.description.toLowerCase().split(/\s+/);
    
    if (descWords.length < titleWords.length * 1.5) {
      const overlap = titleWords.filter(word => descWords.includes(word));
      if (overlap.length > titleWords.length * 0.8) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Remove similar/duplicate articles
   */
  private static removeSimilarArticles(articles: Article[]): Article[] {
    const seen = new Map<string, Article>();
    const result: Article[] = [];
    
    for (const article of articles) {
      // Create a normalized key for comparison
      const key = this.createArticleKey(article);
      
      if (!seen.has(key)) {
        seen.set(key, article);
        result.push(article);
      } else {
        // Keep the article with more content
        const existing = seen.get(key)!;
        if (article.description.length > existing.description.length) {
          const index = result.indexOf(existing);
          if (index !== -1) {
            result[index] = article;
            seen.set(key, article);
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Create a normalized key for article comparison
   */
  private static createArticleKey(article: Article): string {
    // Normalize title for comparison
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(' ')
      .slice(0, 10) // First 10 words
      .join(' ');
    
    return normalizedTitle;
  }

  /**
   * Clean and enhance article content
   */
  private static cleanArticle(article: Article): Article {
    return {
      ...article,
      title: this.cleanTitle(article.title),
      description: this.cleanDescription(article.description),
      source: this.cleanSource(article.source),
    };
  }

  /**
   * Clean article title
   */
  private static cleanTitle(title: string): string {
    if (!title) return '';
    
    let cleaned = title.trim();
    
    // Remove source suffixes
    cleaned = cleaned.replace(/\s*[-|]\s*[^-|]+$/, '');
    
    // Fix common encoding issues
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Capitalize first letter if all lowercase
    if (cleaned === cleaned.toLowerCase()) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    return cleaned;
  }

  /**
   * Clean article description
   */
  private static cleanDescription(description: string): string {
    if (!description) return '';
    
    let cleaned = description.trim();
    
    // Remove "Read more" type suffixes
    cleaned = cleaned.replace(/(\.\.\.|…)\s*(Read\s+more|Continue\s+reading).*$/i, '...');
    
    // Fix encoding
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Ensure it ends properly
    if (cleaned && !cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }
    
    return cleaned;
  }

  /**
   * Clean source name
   */
  private static cleanSource(source: string): string {
    if (!source) return 'Unknown Source';
    
    // Remove common suffixes
    let cleaned = source
      .replace(/\s*(RSS|Feed|News|\.com|\.org|\.net|\.in)$/i, '')
      .trim();
    
    // Ensure proper capitalization
    if (cleaned.length > 0) {
      cleaned = cleaned
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return cleaned || 'Unknown Source';
  }

  /**
   * Validate and score article quality (0-100)
   */
  static scoreArticle(article: Article): number {
    let score = 0;
    
    // Title quality (30 points)
    if (article.title) {
      const titleLength = article.title.trim().length;
      if (titleLength >= 30 && titleLength <= 150) score += 20;
      else if (titleLength >= 20 && titleLength <= 200) score += 10;
      
      // No special characters abuse
      if (!/(!!|@@|##|\$\$|%%|\^\^|&&|\*\*|\(\(|\)\))/.test(article.title)) {
        score += 10;
      }
    }
    
    // Description quality (30 points)
    if (article.description) {
      const descLength = article.description.trim().length;
      if (descLength >= 50 && descLength <= 300) score += 20;
      else if (descLength >= 30 && descLength <= 400) score += 10;
      
      // Different from title
      if (article.title && article.description !== article.title) {
        score += 10;
      }
    }
    
    // URL quality (10 points)
    if (article.url && this.hasValidUrl(article.url)) {
      score += 10;
    }
    
    // Image presence (10 points)
    if (article.urlToImage && article.urlToImage.startsWith('http')) {
      score += 10;
    }
    
    // Source quality (10 points)
    if (article.source && article.source !== 'Unknown Source') {
      score += 10;
    }
    
    // Date recency (10 points)
    if (article.publishedAt) {
      const date = new Date(article.publishedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff <= 24) score += 10;
      else if (hoursDiff <= 72) score += 5;
    }
    
    return Math.min(100, score);
  }

  /**
   * Filter articles by minimum quality score
   */
  static filterByQualityScore(articles: Article[], minScore: number = 50): Article[] {
    return articles.filter(article => this.scoreArticle(article) >= minScore);
  }
}