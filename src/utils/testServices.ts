import { Category } from '../types/Article';
import CategoryService from '../services/categoryService';

export class ServiceTester {
  private categoryService = CategoryService.getInstance();

  async testAllServices() {
    console.log('🔍 Testing all NewsHub services...\n');
    
    const categories = [
      { cat: Category.SOFTWARE, name: 'Software/Tech' },
      { cat: Category.SPORTS, name: 'Sports' },
      { cat: Category.INDIA, name: 'Indian News' },
      { cat: Category.POLITICAL, name: 'Political' },
      { cat: Category.WORLD, name: 'World News' },
      { cat: Category.BUSINESS, name: 'Business' },
      { cat: Category.BREAKING, name: 'Breaking News' },
      { cat: Category.ALL, name: 'All Categories' },
    ];

    for (const { cat, name } of categories) {
      await this.testCategory(cat, name);
      await this.sleep(1000); // Wait 1 second between tests
    }

    console.log('✅ All service tests completed!\n');
  }

  private async testCategory(category: Category, name: string) {
    try {
      console.log(`📊 Testing ${name}...`);
      const startTime = Date.now();
      
      const response = await this.categoryService.getArticles(category, 5);
      const duration = Date.now() - startTime;
      
      if (response.data.length > 0) {
        console.log(`  ✅ Success: ${response.data.length} articles from ${response.source} (${duration}ms)`);
        console.log(`     Sample: "${response.data[0].title.slice(0, 60)}..."`);
      } else {
        console.log(`  ⚠️  No articles: ${response.source} (${duration}ms)`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log('');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testSingleCategory(category: Category, limit: number = 10) {
    console.log(`🔍 Testing ${category} category with ${limit} articles...\n`);
    
    try {
      const startTime = Date.now();
      const response = await this.categoryService.getArticles(category, limit);
      const duration = Date.now() - startTime;
      
      console.log(`📊 Results:`);
      console.log(`  Source: ${response.source}`);
      console.log(`  Articles: ${response.data.length}`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Has More: ${response.hasMore}`);
      console.log(`  Total Results: ${response.totalResults || 'N/A'}\n`);
      
      if (response.data.length > 0) {
        console.log(`📝 Sample Articles:`);
        response.data.slice(0, 3).forEach((article, i) => {
          console.log(`  ${i + 1}. ${article.title}`);
          console.log(`     Source: ${article.source} | ${article.publishedAt}`);
          console.log(`     URL: ${article.url}\n`);
        });
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Test failed:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceTester = new ServiceTester();
