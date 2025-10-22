/**
 * Enhanced HTML cleaning utility for news article content
 * Handles complex HTML structures from RSS feeds
 */

export class HTMLCleaner {
  /**
   * Remove all HTML tags and decode entities
   */
  static stripHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    let cleaned = html;

    // Remove CDATA sections first
    cleaned = cleaned.replace(/<!(\[CDATA\[[\s\S]*?\]\])>/g, '');
    cleaned = cleaned.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

    // Remove script and style content completely
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    
    // Convert common block elements to spaces/newlines
    cleaned = cleaned.replace(/<\/?(div|p|br|hr)[^>]*>/gi, ' ');
    cleaned = cleaned.replace(/<\/(h[1-6]|li|ul|ol|blockquote)[^>]*>/gi, ' ');
    
    // Remove all remaining HTML tags (more comprehensive)
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = HTMLCleaner.decodeHtmlEntities(cleaned);
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Remove common unwanted phrases
    cleaned = HTMLCleaner.removeUnwantedPhrases(cleaned);
    
    return cleaned;
  }

  /**
   * Decode HTML entities more comprehensively
   */
  private static decodeHtmlEntities(text: string): string {
    const entityMap: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&#39;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&hellip;': '...',
      '&mdash;': '\u2014',
      '&ndash;': '\u2013',
      '&lsquo;': '\u2018',
      '&rsquo;': '\u2019',
      '&ldquo;': '\u201C',
      '&rdquo;': '\u201D',
    };

    let decoded = text;
    
    // Replace named entities
    Object.keys(entityMap).forEach(entity => {
      decoded = decoded.replace(new RegExp(entity, 'g'), entityMap[entity]);
    });
    
    // Replace numeric entities (&#123; and &#x1A;)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    decoded = decoded.replace(/&#x([a-fA-F\d]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decoded;
  }

  /**
   * Remove unwanted phrases commonly found in RSS feeds
   */
  private static removeUnwantedPhrases(text: string): string {
    const unwantedPatterns = [
      /Read more\.{0,3}$/i,
      /Continue reading\.{0,3}$/i,
      /Click here for more\.{0,3}$/i,
      /Source: .+$/i,
      /Photo: .+$/i,
      /Image: .+$/i,
      /\[.*?\]$/g, // Remove trailing [Source Name] etc
      /^\s*-\s+/, // Remove leading dashes
    ];

    let cleaned = text;
    unwantedPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned.trim();
  }

  /**
   * Smart truncate text to specific length while preserving word boundaries
   */
  static smartTruncate(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) { // Don't cut too much
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Clean and format article title
   */
  static cleanTitle(title: string): string {
    if (!title) return '';
    
    let cleaned = HTMLCleaner.stripHtml(title);
    
    // Remove common title suffixes
    cleaned = cleaned.replace(/\s*-\s*.+$/, ''); // Remove "- Source Name"
    cleaned = cleaned.replace(/\s*\|\s*.+$/, ''); // Remove "| Source Name"
    
    return cleaned.trim();
  }
}