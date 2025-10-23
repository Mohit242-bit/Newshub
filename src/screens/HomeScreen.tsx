import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  Alert,
} from 'react-native';
import { Article, Category, ServiceResponse } from '../types/Article';
import CategoryHeader from '../components/CategoryHeader';
import NewsList from '../components/NewsList';
import PreloadingService from '../services/preloadingService';
import NetworkService from '../services/networkService';

const HomeScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentSource, setCurrentSource] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean>(true);

  const preloadingService = PreloadingService.getInstance();
  const networkService = NetworkService.getInstance();

  const fetchArticles = useCallback(async (
    category: Category,
    isRefresh = false,
    isLoadMore = false
  ) => {
    console.log(`🚀 Starting fetchArticles for ${category}, refresh=${isRefresh}, loadMore=${isLoadMore}`);
    
    if (isRefresh) {
      setRefreshing(true);
    } else if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log('📡 About to call preloadingService.getArticles...');
      const response: ServiceResponse<Article[]> = isRefresh 
        ? await preloadingService.refreshCategory(category)
        : await preloadingService.getArticles(category);

      console.log('✅ Got response from preloadingService:', {
        articlesCount: response.data.length,
        source: response.source,
        hasMore: response.hasMore
      });

      const newArticles = response.data;
      
      if (isRefresh || !isLoadMore) {
        setArticles(newArticles);
        console.log(`📰 Set ${newArticles.length} articles (replace mode)`);
      } else {
        // For load more, append to existing articles
        setArticles(prev => {
          const updated = [...prev, ...newArticles];
          console.log(`📰 Appended ${newArticles.length} articles, total now: ${updated.length}`);
          return updated;
        });
      }
      
      setHasMore(response.hasMore);
      setCurrentSource(response.source);
      
      // Show success message for demo purposes
      if (newArticles.length > 0) {
        console.log(`✅ Loaded ${newArticles.length} articles from ${response.source}`);
      } else {
        console.log('⚠️ No articles returned from service');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch articles';
      setError(errorMessage);
      console.error('❌ Failed to fetch articles:', err);
      console.error('❌ Error details:', {
        message: errorMessage,
        category,
        isRefresh,
        isLoadMore
      });
      
      // Only show alert for non-cached errors
      if (!errorMessage.includes('cached')) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      console.log('🏁 Completed fetchArticles, setting loading states to false');
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [preloadingService]);

  const handleCategoryChange = useCallback(async (category: Category) => {
    setSelectedCategory(category);
    
    // Fetch articles for selected category (will be instant if pre-loaded)
    await fetchArticles(category);
    
    // Pre-load related categories in background
    preloadingService.preloadRelatedCategories(category);
  }, [fetchArticles, preloadingService]);

  const handleRefresh = useCallback(() => {
    fetchArticles(selectedCategory, true);
  }, [fetchArticles, selectedCategory]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchArticles(selectedCategory, false, true);
    }
  }, [fetchArticles, selectedCategory, loadingMore, hasMore]);

  // Initialize pre-loading on app start
  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      try {
        console.log('🎆 Initializing NewsHub app...');
        console.log('📂 Selected category:', selectedCategory);
        
        if (!isMounted) return;
        
        // Load current category immediately with timeout
        console.log('🚀 Loading initial articles...');
        const loadPromise = fetchArticles(selectedCategory);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Article loading timeout')), 10000);
        });
        
        try {
          await Promise.race([loadPromise, timeoutPromise]);
        } catch (timeoutErr) {
          console.warn('⚠️ Initial article loading timed out, continuing anyway:', timeoutErr);
        }
        
        if (!isMounted) return;
        
        console.log('✅ Initial articles loaded');
        
        // Check network status and update UI
        try {
          const isNetworkAvailable = networkService.getNetworkStatus();
          if (isMounted) {
            setNetworkStatus(isNetworkAvailable);
          }
          console.log(`🌐 Network status: ${isNetworkAvailable ? 'Available' : 'Unavailable'}`);
        } catch (networkErr) {
          console.warn('⚠️ Failed to check network status:', networkErr);
        }
        
        if (!isMounted) return;
        
        // Start background pre-loading of other categories
        console.log('🔄 Starting background pre-loading...');
        try {
          preloadingService.startPreloading();
          console.log('✅ Background pre-loading started');
        } catch (preloadErr) {
          console.warn('⚠️ Background pre-loading failed to start:', preloadErr);
        }
      } catch (initError) {
        if (isMounted) {
          console.error('❌ App initialization failed:', initError);
          setError(`Initialization error: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
          // Don't let errors prevent the app from showing - show empty state with retry
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const getEmptyMessage = () => {
    if (error) {
      return `Error: ${error}`;
    }
    
    switch (selectedCategory) {
      case Category.SOFTWARE:
        return 'No software articles available at the moment';
      case Category.BREAKING:
        return 'No breaking news right now';
      case Category.POLITICAL:
      case Category.INDIA:
        return 'Indian political news coming soon';
      case Category.SPORTS:
        return 'Sports news coming soon';
      case Category.BUSINESS:
        return 'Business news coming soon';
      case Category.WORLD:
        return 'World news coming soon';
      default:
        return 'No articles available';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle}>NewsHub</Text>
          {!networkStatus && (
            <View style={styles.networkIndicator}>
              <Text style={styles.networkText}>
                📵 Offline
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          {networkStatus 
            ? 'Stay informed with the latest updates' 
            : 'Offline mode - Showing cached content'
          }
        </Text>
      </View>
      
      <CategoryHeader
        activeCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      {articles.length > 0 && (
        <View style={styles.articleCount}>
          <Text style={styles.articleCountText}>
            📰 {articles.length} articles loaded from {currentSource}
            {hasMore && ' • Pull up for more'}
          </Text>
        </View>
      )}
      
      <NewsList
        articles={articles}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onLoadMore={hasMore ? handleLoadMore : undefined}
        hasMore={hasMore}
        loadingMore={loadingMore}
        emptyMessage={getEmptyMessage()}
        source={currentSource}
      />
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Some sources may be unavailable. Showing cached content.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  networkIndicator: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffeaa7',
  },
  errorText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  articleCount: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  articleCountText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default HomeScreen;
