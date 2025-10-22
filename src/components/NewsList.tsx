import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Article } from '../types/Article';

interface NewsListProps {
  articles: Article[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  emptyMessage?: string;
  source?: string;
}

const NewsList: React.FC<NewsListProps> = ({
  articles,
  loading,
  refreshing,
  onRefresh,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  emptyMessage = 'No articles available',
  source,
}) => {
  const handleArticlePress = useCallback(async (article: Article) => {
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  }, []);

  const formatTimeAgo = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  const renderArticle = useCallback(({ item: article }: { item: Article }) => {
    // Check if this is an enhanced article with popularity metrics
    const isPopular = (article as any).popularityMetrics?.overallScore > 0.7;
    const isTrending = (article as any).popularityMetrics?.trendingScore > 0.3;
    const isRecent = (article as any).popularityMetrics?.recencyScore > 0.8;
    
    return (
    <TouchableOpacity
      style={styles.articleContainer}
      onPress={() => handleArticlePress(article)}
      activeOpacity={0.7}
    >
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <View style={styles.sourceContainer}>
            <Text style={styles.source}>{article.source}</Text>
            {isPopular && <Text style={styles.popularBadge}>🔥 Popular</Text>}
            {isTrending && <Text style={styles.trendingBadge}>📈 Trending</Text>}
            {isRecent && <Text style={styles.recentBadge}>🆕 Breaking</Text>}
          </View>
          <Text style={styles.timeAgo}>
            {formatTimeAgo(article.publishedAt)}
          </Text>
        </View>
        
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
        
        {article.description && (
          <Text style={styles.description} numberOfLines={3}>
            {article.description}
          </Text>
        )}
        
        <View style={styles.articleFooter}>
          {article.author && (
            <Text style={styles.author}>By {article.author}</Text>
          )}
          {article.readTime && (
            <Text style={styles.readTime}>{article.readTime} min read</Text>
          )}
        </View>
        
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {article.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {article.urlToImage && (
        <Image
          source={{ uri: article.urlToImage }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
    );
  }, [handleArticlePress, formatTimeAgo]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      {source && (
        <Text style={styles.sourceText}>Source: {source}</Text>
      )}
    </View>
  );

  if (loading && articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading articles...</Text>
        {source && (
          <Text style={styles.sourceText}>from {source}</Text>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={articles}
      renderItem={renderArticle}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={hasMore && onLoadMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  sourceText: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  articleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  articleContent: {
    flex: 1,
    marginRight: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  popularBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    backgroundColor: '#FFF4F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginTop: 2,
  },
  trendingBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00BCD4',
    backgroundColor: '#F0FDFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginTop: 2,
  },
  recentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 14,
    fontWeight: '400',
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  readTime: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});

export default NewsList;
