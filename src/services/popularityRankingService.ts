import { Article, Category } from '../types/Article';

export interface PopularityMetrics {
  recencyScore: number;
  engagementScore: number;
  sourceCredibilityScore: number;
  trendingScore: number;
  categoryRelevanceScore: number;
  overallScore: number;
}

export interface EnhancedArticle extends Article {
  popularityMetrics: PopularityMetrics;
}

class PopularityRankingService {
  private static instance: PopularityRankingService;
  
  // Popular keywords by category for trending detection
  private trendingKeywords: { [key in Category]?: string[] } = {
    [Category.INDIA]: ['breaking', 'parliament', 'election', 'modi', 'congress', 'bjp', 'supreme court', 'bollywood', 'cricket', 'startup'],
    [Category.TECH]: ['ai', 'artificial intelligence', 'smartphone', 'apple', 'google', 'microsoft', 'meta', 'tesla', 'breakthrough', 'innovation'],
    [Category.SOFTWARE]: ['react', 'javascript', 'python', 'github', 'release', 'update', 'security', 'bug', 'feature', 'developer'],
    [Category.AI_ML]: ['chatgpt', 'openai', 'machine learning', 'neural network', 'deep learning', 'llm', 'automation', 'robot'],
    [Category.SPORTS]: ['football', 'cricket', 'olympics', 'world cup', 'champion', 'record', 'goal', 'victory', 'tournament'],
    [Category.BUSINESS]: ['stock', 'market', 'ipo', 'revenue', 'profit', 'acquisition', 'merger', 'ceo', 'funding', 'investment'],
    [Category.SCIENCE]: ['research', 'discovery', 'study', 'breakthrough', 'climate', 'space', 'nasa', 'vaccine', 'gene', 'quantum'],
    [Category.STARTUPS]: ['funding', 'unicorn', 'ipo', 'valuation', 'series', 'venture', 'founder', 'launch', 'growth', 'acquisition']
  };

  // Credible news sources with scores
  private sourceCredibility: { [key: string]: number } = {
    'BBC': 0.95,
    'Reuters': 0.95,
    'Associated Press': 0.9,
    'The Hindu': 0.85,
    'Times of India': 0.8,
    'Economic Times': 0.85,
    'TechCrunch': 0.8,
    'Ars Technica': 0.85,
    'The Verge': 0.75,
    'GitHub': 0.9,
    'Dev.to': 0.7,
    'Hacker News': 0.8,
    'ESPN': 0.8,
    'Nature': 0.95,
    'Science': 0.95,
    'MIT Technology Review': 0.9,
    // Default for unknown sources
    'default': 0.5
  };

  static getInstance(): PopularityRankingService {
    if (!PopularityRankingService.instance) {
      PopularityRankingService.instance = new PopularityRankingService();
    }
    return PopularityRankingService.instance;
  }

  private calculateRecencyScore(publishedAt: string): number {
    const now = new Date();
    const articleDate = new Date(publishedAt);
    const hoursAgo = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
    
    // Score decreases over time: 1.0 for 0-2 hours, 0.8 for 2-12 hours, etc.
    if (hoursAgo <= 2) return 1.0;
    if (hoursAgo <= 12) return 0.8;
    if (hoursAgo <= 24) return 0.6;
    if (hoursAgo <= 72) return 0.4;
    if (hoursAgo <= 168) return 0.2; // 1 week
    return 0.1;
  }

  private calculateEngagementScore(article: Article): number {
    // Simulate engagement based on title characteristics
    let score = 0.5; // Base score
    
    const title = article.title.toLowerCase();
    const description = article.description?.toLowerCase() || '';
    
    // Engagement indicators
    const engagementWords = ['breaking', 'exclusive', 'revealed', 'shocking', 'major', 'announces', 'launches', 'new', 'first', 'record'];
    const engagementCount = engagementWords.filter(word => title.includes(word) || description.includes(word)).length;
    
    score += engagementCount * 0.1;
    
    // Title length optimization (not too short, not too long)
    const titleLength = article.title.length;
    if (titleLength >= 40 && titleLength <= 80) {
      score += 0.2;
    }
    
    // Has image bonus
    if (article.urlToImage) {
      score += 0.1;
    }
    
    // Has author bonus
    if (article.author) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateSourceCredibilityScore(source: string): number {
    return this.sourceCredibility[source] || this.sourceCredibility['default'];
  }

  private calculateTrendingScore(article: Article, category: Category): number {
    const keywords = this.trendingKeywords[category] || [];
    const title = article.title.toLowerCase();
    const description = article.description?.toLowerCase() || '';
    
    const matchCount = keywords.filter((keyword: string) =>
      title.includes(keyword) || description.includes(keyword)
    ).length;
    
    return Math.min(matchCount * 0.15, 1.0);
  }

  private calculateCategoryRelevanceScore(article: Article, targetCategory: Category): number {
    // Perfect match
    if (article.category === targetCategory) return 1.0;
    
    // Related categories get partial score
    const categoryRelations: { [key in Category]?: Category[] } = {
      [Category.TECH]: [Category.SOFTWARE, Category.AI_ML, Category.WEB_DEV, Category.MOBILE_DEV],
      [Category.SOFTWARE]: [Category.TECH, Category.AI_ML, Category.WEB_DEV],
      [Category.AI_ML]: [Category.TECH, Category.SOFTWARE, Category.SCIENCE],
      [Category.INDIA]: [Category.POLITICAL, Category.BUSINESS, Category.SPORTS],
      [Category.BUSINESS]: [Category.STARTUPS, Category.TECH],
      [Category.STARTUPS]: [Category.BUSINESS, Category.TECH]
    };
    
    const relatedCategories = categoryRelations[targetCategory] || [];
    if (relatedCategories.includes(article.category)) {
      return 0.6;
    }
    
    // All category shows everything
    if (targetCategory === Category.ALL) return 0.8;
    
    return 0.1;
  }

  public enhanceArticleWithPopularity(article: Article, targetCategory: Category): EnhancedArticle {
    const recencyScore = this.calculateRecencyScore(article.publishedAt);
    const engagementScore = this.calculateEngagementScore(article);
    const sourceCredibilityScore = this.calculateSourceCredibilityScore(article.source);
    const trendingScore = this.calculateTrendingScore(article, targetCategory);
    const categoryRelevanceScore = this.calculateCategoryRelevanceScore(article, targetCategory);
    
    // Weighted overall score
    const overallScore = (
      recencyScore * 0.25 +           // 25% weight to recency
      engagementScore * 0.20 +        // 20% weight to engagement
      sourceCredibilityScore * 0.15 +  // 15% weight to source credibility
      trendingScore * 0.25 +          // 25% weight to trending
      categoryRelevanceScore * 0.15    // 15% weight to category relevance
    );

    return {
      ...article,
      popularityMetrics: {
        recencyScore,
        engagementScore,
        sourceCredibilityScore,
        trendingScore,
        categoryRelevanceScore,
        overallScore
      }
    };
  }

  public rankArticlesByPopularity(articles: Article[], category: Category): EnhancedArticle[] {
    const enhancedArticles = articles.map(article => 
      this.enhanceArticleWithPopularity(article, category)
    );
    
    // Sort by overall popularity score (descending)
    return enhancedArticles.sort((a, b) => b.popularityMetrics.overallScore - a.popularityMetrics.overallScore);
  }

  // Get trending topics for a category
  public getTrendingTopics(category: Category): string[] {
    return this.trendingKeywords[category]?.slice(0, 5) || [];
  }

  // Add engagement simulation for demo purposes
  public simulateEngagementMetrics(article: Article): { likes: number, shares: number, comments: number } {
    const baseScore = this.calculateEngagementScore(article);
    const multiplier = Math.floor(baseScore * 1000);
    
    return {
      likes: Math.floor(Math.random() * multiplier + 10),
      shares: Math.floor(Math.random() * (multiplier / 5) + 2),
      comments: Math.floor(Math.random() * (multiplier / 10) + 1)
    };
  }
}

export default PopularityRankingService;