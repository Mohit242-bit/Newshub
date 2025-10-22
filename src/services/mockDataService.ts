import { Article, Category, ServiceResponse } from '../types/Article';

class MockDataService {
  private static instance: MockDataService;
  
  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  getMockArticles(category: Category, limit: number = 30): ServiceResponse<Article[]> {
    const baseArticles = [
      // Breaking India News
      {
        id: 'mock_india_1',
        title: 'Breaking: Parliament Winter Session Begins with Key Economic Bills',
        description: 'The winter session of Parliament has commenced with the government planning to introduce several crucial economic reform bills including the new banking regulation act.',
        url: 'https://www.thehindu.com/',
        urlToImage: 'https://picsum.photos/400/300?random=1',
        author: 'Political Correspondent',
        source: 'The Hindu',
        publishedAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        category: Category.INDIA,
        tags: ['parliament', 'economic-reforms', 'breaking']
      },
      {
        id: 'mock_india_2',
        title: 'Major Announcement: India Launches Digital Rupee Pilot in 15 Cities',
        description: 'Reserve Bank of India expands the digital currency pilot program to major metropolitan cities, marking a significant step towards cashless economy.',
        url: 'https://economictimes.indiatimes.com/',
        urlToImage: 'https://picsum.photos/400/300?random=2',
        author: 'Finance Reporter',
        source: 'Economic Times',
        publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        category: Category.INDIA,
        tags: ['digital-rupee', 'rbi', 'fintech']
      },
      {
        id: 'mock_india_3',
        title: 'Exclusive: Indian Space Program Sets New World Record with 104 Satellites',
        description: 'ISRO successfully launches 104 satellites in a single mission, breaking the previous world record and establishing India as a major space power.',
        url: 'https://www.isro.gov.in/',
        urlToImage: 'https://picsum.photos/400/300?random=3',
        author: 'Space Correspondent',
        source: 'ISRO News',
        publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        category: Category.INDIA,
        tags: ['isro', 'satellites', 'space', 'record']
      },
      // Tech & Innovation
      {
        id: 'mock_1',
        title: 'NewsHub - Multi-Source News Aggregator',
        description: 'NewsHub combines the best of Dev.to, Hacker News, NewsAPI, and RSS feeds to deliver a comprehensive news reading experience.',
        url: 'https://github.com/',
        author: 'NewsHub Team',
        source: 'NewsHub Demo',
        publishedAt: new Date().toISOString(),
        category: Category.SOFTWARE,
        tags: ['react-native', 'news', 'aggregator']
      },
      {
        id: 'mock_2',
        title: 'Understanding React Native Performance',
        description: 'Learn how to optimize your React Native apps for better performance, including memory management, rendering optimizations, and network efficiency.',
        url: 'https://reactnative.dev/docs/performance',
        author: 'Tech Expert',
        source: 'Dev Community',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        category: Category.SOFTWARE,
        tags: ['react-native', 'performance', 'optimization']
      },
      {
        id: 'mock_3',
        title: 'Latest in JavaScript Development',
        description: 'Explore the newest features in JavaScript, including ES2024 updates, new APIs, and best practices for modern web development.',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        author: 'JS Developer',
        source: 'JavaScript Weekly',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        category: Category.TECH,
        tags: ['javascript', 'es2024', 'web-development']
      },
      {
        id: 'mock_4',
        title: 'AI Revolution in Software Development',
        description: 'How artificial intelligence is transforming the way we write, test, and deploy code. From GitHub Copilot to automated testing.',
        url: 'https://github.com/features/copilot',
        author: 'AI Researcher',
        source: 'Tech Insights',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        category: Category.AI_ML,
        tags: ['ai', 'machine-learning', 'coding-tools']
      },
      {
        id: 'mock_5',
        title: 'Mobile App Development Trends 2024',
        description: 'The latest trends in mobile app development, including cross-platform frameworks, progressive web apps, and emerging technologies.',
        url: 'https://flutter.dev/',
        author: 'Mobile Expert',
        source: 'Mobile Dev Weekly',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        category: Category.MOBILE_DEV,
        tags: ['mobile', 'trends', 'cross-platform']
      },
      {
        id: 'mock_6',
        title: 'India Tech News: Startup Ecosystem Growth',
        description: 'Indian startup ecosystem continues to show remarkable growth with new unicorns and increased investor interest in technology sectors.',
        url: 'https://www.startupindia.gov.in/',
        author: 'Business Reporter',
        source: 'Tech India Today',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
        category: Category.INDIA,
        tags: ['india', 'startup', 'business']
      },
      {
        id: 'mock_7',
        title: 'Breaking: Major Security Update Released',
        description: 'Critical security patches have been released for popular frameworks. Developers advised to update immediately to prevent vulnerabilities.',
        url: 'https://github.com/advisories',
        author: 'Security Team',
        source: 'Security Alert',
        publishedAt: new Date(Date.now() - 1800000).toISOString(),
        category: Category.BREAKING,
        tags: ['security', 'update', 'breaking']
      },
      {
        id: 'mock_8',
        title: 'Sports Tech: Data Analytics in Modern Games',
        description: 'How technology and data analytics are revolutionizing sports performance, fan engagement, and game strategies across different sports.',
        url: 'https://www.espn.com/',
        author: 'Sports Tech Writer',
        source: 'Sports Innovation',
        publishedAt: new Date(Date.now() - 21600000).toISOString(),
        category: Category.SPORTS,
        tags: ['sports', 'analytics', 'technology']
      },
      {
        id: 'mock_9',
        title: 'Global Tech Market Analysis',
        description: 'Comprehensive analysis of the global technology market, including emerging markets, investment trends, and future predictions.',
        url: 'https://techcrunch.com/',
        author: 'Market Analyst',
        source: 'World Tech Report',
        publishedAt: new Date(Date.now() - 25200000).toISOString(),
        category: Category.WORLD,
        tags: ['global', 'market', 'analysis']
      },
      {
        id: 'mock_10',
        title: 'Business Innovation: Digital Transformation',
        description: 'How businesses are leveraging digital transformation to improve efficiency, customer experience, and competitive advantage.',
        url: 'https://www.microsoft.com/',
        author: 'Business Expert',
        source: 'Business Innovation',
        publishedAt: new Date(Date.now() - 28800000).toISOString(),
        category: Category.BUSINESS,
        tags: ['business', 'digital', 'transformation']
      },
      {
        id: 'mock_11',
        title: '10 Easy Weeknight Dinner Recipes',
        description: 'Quick and delicious dinner ideas that can be prepared in 30 minutes or less, perfect for busy weeknights.',
        url: 'https://www.allrecipes.com/',
        author: 'Chef Maria',
        source: 'Cooking Today',
        publishedAt: new Date(Date.now() - 32400000).toISOString(),
        category: Category.COOKING,
        tags: ['quick-meals', 'dinner', 'family-friendly']
      },
      {
        id: 'mock_12',
        title: 'The Science of Perfect Pasta',
        description: 'Understanding the chemistry behind cooking pasta al dente and the best techniques for achieving restaurant-quality results at home.',
        url: 'https://www.seriouseats.com/',
        author: 'Food Scientist',
        source: 'Culinary Science',
        publishedAt: new Date(Date.now() - 36000000).toISOString(),
        category: Category.COOKING,
        tags: ['pasta', 'technique', 'science']
      },
      // More India Breaking News
      {
        id: 'mock_india_4',
        title: 'Breaking: Supreme Court Delivers Historic Verdict on Privacy Rights',
        description: 'In a landmark judgment, the Supreme Court unanimously rules that privacy is a fundamental right, impacting digital governance and data protection laws.',
        url: 'https://www.thehindu.com/',
        urlToImage: 'https://picsum.photos/400/300?random=4',
        author: 'Legal Correspondent',
        source: 'The Hindu',
        publishedAt: new Date(Date.now() - 900000).toISOString(), // 15 mins ago
        category: Category.INDIA,
        tags: ['supreme-court', 'privacy', 'fundamental-rights', 'breaking']
      },
      {
        id: 'mock_startup_1',
        title: 'Exclusive: Bengaluru Startup Raises $100M Series C, Becomes New Unicorn',
        description: 'FinTech startup revolutionizing digital payments for rural India secures massive funding round led by Sequoia Capital and Tiger Global.',
        url: 'https://economictimes.indiatimes.com/',
        urlToImage: 'https://picsum.photos/400/300?random=5',
        author: 'Startup Reporter',
        source: 'Economic Times',
        publishedAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
        category: Category.STARTUPS,
        tags: ['unicorn', 'funding', 'fintech', 'bengaluru']
      },
      {
        id: 'mock_tech_popular',
        title: 'Revolutionary: Google Announces Breakthrough in Quantum Computing',
        description: 'Google claims quantum supremacy with new 70-qubit processor, solving complex problems in seconds that would take classical computers millennia.',
        url: 'https://techcrunch.com/',
        urlToImage: 'https://picsum.photos/400/300?random=6',
        author: 'Tech Reporter',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        category: Category.TECH,
        tags: ['google', 'quantum', 'breakthrough', 'computing']
      },
      {
        id: 'mock_ai_trending',
        title: 'ChatGPT-4 Turbo Launches: New AI Model Shows 40% Performance Boost',
        description: 'OpenAI releases upgraded version of ChatGPT with enhanced reasoning capabilities and reduced response times, setting new industry benchmarks.',
        url: 'https://openai.com/',
        urlToImage: 'https://picsum.photos/400/300?random=7',
        author: 'AI Specialist',
        source: 'OpenAI Blog',
        publishedAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        category: Category.AI_ML,
        tags: ['chatgpt', 'openai', 'ai-model', 'performance']
      },
      // Additional Indian News for Better Coverage
      {
        id: 'mock_india_5',
        title: 'Breaking: India GDP Growth Exceeds Expectations at 7.2%',
        description: 'India\'s economy shows robust growth in Q3, driven by manufacturing and services sectors, outpacing global economic forecasts.',
        url: 'https://economictimes.indiatimes.com/',
        urlToImage: 'https://picsum.photos/400/300?random=8',
        author: 'Economic Editor',
        source: 'Economic Times',
        publishedAt: new Date(Date.now() - 2700000).toISOString(), // 45 mins ago
        category: Category.INDIA,
        tags: ['gdp', 'economy', 'growth', 'breaking']
      },
      {
        id: 'mock_india_6',
        title: 'Major: PM Modi Launches National Health Mission 2.0',
        description: 'Prime Minister announces ambitious healthcare reforms targeting rural areas, with ₹2 lakh crore investment over 5 years.',
        url: 'https://www.pmindia.gov.in/',
        urlToImage: 'https://picsum.photos/400/300?random=9',
        author: 'Health Correspondent',
        source: 'PIB India',
        publishedAt: new Date(Date.now() - 4500000).toISOString(), // 1.25 hours ago
        category: Category.INDIA,
        tags: ['healthcare', 'policy', 'modi', 'rural-development']
      },
      {
        id: 'mock_india_7',
        title: 'Exclusive: Indian Railways Unveils High-Speed Bullet Train Timeline',
        description: 'Mumbai-Ahmedabad bullet train project accelerates with Japanese technology, expected completion by 2028.',
        url: 'https://indianrailways.gov.in/',
        urlToImage: 'https://picsum.photos/400/300?random=10',
        author: 'Transport Reporter',
        source: 'Railway News',
        publishedAt: new Date(Date.now() - 9000000).toISOString(), // 2.5 hours ago
        category: Category.INDIA,
        tags: ['railways', 'bullet-train', 'infrastructure', 'exclusive']
      },
      {
        id: 'mock_india_8',
        title: 'Breaking: Chandrayaan-3 Successfully Lands on Moon\'s South Pole',
        description: 'ISRO achieves historic milestone as India becomes fourth country to land on moon, first to reach lunar south pole.',
        url: 'https://www.isro.gov.in/',
        urlToImage: 'https://picsum.photos/400/300?random=11',
        author: 'Space Editor',
        source: 'ISRO Official',
        publishedAt: new Date(Date.now() - 12600000).toISOString(), // 3.5 hours ago
        category: Category.INDIA,
        tags: ['chandrayaan', 'moon-landing', 'isro', 'breaking', 'space']
      },
      {
        id: 'mock_india_9',
        title: 'Major: India-UK FTA Talks Enter Final Phase',
        description: 'Trade negotiations between India and UK reach conclusive stage, expected to boost bilateral trade by $100 billion.',
        url: 'https://www.thehindu.com/',
        urlToImage: 'https://picsum.photos/400/300?random=12',
        author: 'Trade Correspondent',
        source: 'The Hindu',
        publishedAt: new Date(Date.now() - 16200000).toISOString(), // 4.5 hours ago
        category: Category.INDIA,
        tags: ['trade', 'uk', 'fta', 'bilateral', 'economy']
      }
    ];

    // Filter articles by category or return all for ALL category
    let filteredArticles = baseArticles;
    if (category !== Category.ALL) {
      filteredArticles = baseArticles.filter(article => article.category === category);
    }

    // If no articles for specific category, provide some generic ones
    if (filteredArticles.length === 0) {
      filteredArticles = baseArticles.slice(0, 3).map((article, index) => ({
        ...article,
        category,
        id: `mock_${category}_${article.id}_${index}_${Date.now()}`,
        title: `${this.getCategoryName(category)}: ${article.title}`
      }));
    }

    // Limit results
    const limitedArticles = filteredArticles.slice(0, limit);

    return {
      data: limitedArticles,
      source: 'Mock Data Service (Demo Mode)',
      timestamp: Date.now(),
      hasMore: filteredArticles.length > limit,
      totalResults: filteredArticles.length
    };
  }

  private getCategoryName(category: Category): string {
    const names = {
      [Category.SOFTWARE]: 'Software Development',
      [Category.TECH]: 'Technology',
      [Category.AI_ML]: 'AI & Machine Learning',
      [Category.WEB_DEV]: 'Web Development',
      [Category.MOBILE_DEV]: 'Mobile Development',
      [Category.POLITICAL]: 'Political News',
      [Category.INDIA]: 'India News',
      [Category.SPORTS]: 'Sports News',
      [Category.BUSINESS]: 'Business News',
      [Category.WORLD]: 'World News',
      [Category.BREAKING]: 'Breaking News',
      [Category.SCIENCE]: 'Science News',
      [Category.STARTUPS]: 'Startup News',
      [Category.COOKING]: 'Cooking & Food',
      [Category.ALL]: 'All News'
    };
    return names[category] || 'News';
  }

  // Simulate network delay for realistic testing
  async getMockArticlesAsync(category: Category, limit: number = 20): Promise<ServiceResponse<Article[]>> {
    // Simulate network delay
    await new Promise<void>(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    return this.getMockArticles(category, limit);
  }
}

export default MockDataService;