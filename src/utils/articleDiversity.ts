import { Article } from '../types/Article';

/**
 * Shuffle articles randomly using Fisher-Yates algorithm
 */
export function shuffleArticles(articles: Article[]): Article[] {
  const shuffled = [...articles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Ensure diversity in articles by mixing sources
 */
export function ensureSourceDiversity(articles: Article[], minSources: number = 2): Article[] {
  if (articles.length === 0) return [];

  // Group articles by source
  const articlesBySource = new Map<string, Article[]>();
  articles.forEach(article => {
    const source = article.source;
    if (!articlesBySource.has(source)) {
      articlesBySource.set(source, []);
    }
    articlesBySource.get(source)!.push(article);
  });

  // If we have less than minimum sources, return shuffled articles
  if (articlesBySource.size < minSources) {
    return shuffleArticles(articles);
  }

  // Interleave articles from different sources
  const diverseArticles: Article[] = [];
  const sources = Array.from(articlesBySource.keys());
  let sourceIndex = 0;

  // First, ensure at least one article from each source
  sources.forEach(source => {
    const sourceArticles = articlesBySource.get(source)!;
    if (sourceArticles.length > 0) {
      diverseArticles.push(sourceArticles.shift()!);
    }
  });

  // Then add remaining articles in round-robin fashion
  let hasMoreArticles = true;
  while (hasMoreArticles && diverseArticles.length < articles.length) {
    hasMoreArticles = false;
    for (const source of sources) {
      const sourceArticles = articlesBySource.get(source)!;
      if (sourceArticles.length > 0) {
        diverseArticles.push(sourceArticles.shift()!);
        hasMoreArticles = true;
      }
    }
  }

  return diverseArticles;
}

/**
 * Remove duplicate articles based on title similarity
 */
export function removeDuplicateArticles(articles: Article[]): Article[] {
  const seen = new Map<string, Article>();
  const uniqueArticles: Article[] = [];

  articles.forEach(article => {
    // Create a normalized key from the title
    const titleKey = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    // Check for similar titles
    let isDuplicate = false;
    for (const [key, existingArticle] of seen.entries()) {
      if (calculateSimilarity(titleKey, key) > 0.8) {
        // Keep the article with more content
        if (article.description.length > existingArticle.description.length) {
          // Replace the existing article
          const index = uniqueArticles.indexOf(existingArticle);
          if (index !== -1) {
            uniqueArticles[index] = article;
            seen.set(titleKey, article);
          }
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(titleKey, article);
      uniqueArticles.push(article);
    }
  });

  return uniqueArticles;
}

/**
 * Calculate similarity between two strings (simple Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Combine multiple article arrays and ensure diversity
 */
export function combineAndDiversifyArticles(
  articleArrays: Article[][],
  targetCount: number = 20
): Article[] {
  // Flatten all articles
  const allArticles = articleArrays.flat();
  
  // Remove duplicates
  const uniqueArticles = removeDuplicateArticles(allArticles);
  
  // Sort by date (newest first)
  uniqueArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  // Ensure source diversity
  const diverseArticles = ensureSourceDiversity(uniqueArticles, 3);
  
  // Take only the target count
  return diverseArticles.slice(0, targetCount);
}

/**
 * Get a variety of articles by mixing recent and popular
 */
export function mixRecentAndPopular(articles: Article[], ratio: number = 0.7): Article[] {
  if (articles.length <= 3) return articles;

  const sortedByDate = [...articles].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const recentCount = Math.floor(articles.length * ratio);
  const popularCount = articles.length - recentCount;

  const recent = sortedByDate.slice(0, recentCount);
  const remaining = sortedByDate.slice(recentCount);
  
  // Shuffle the remaining to add variety
  const popular = shuffleArticles(remaining).slice(0, popularCount);

  // Combine and shuffle for final mix
  return shuffleArticles([...recent, ...popular]);
}
