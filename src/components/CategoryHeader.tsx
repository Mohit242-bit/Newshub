import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Category } from '../types/Article';

export interface NewsCategory {
  id: Category;
  name: string;
  icon: string;
  color: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  { id: Category.ALL, name: '📰 All', icon: 'dashboard', color: '#2196F3' },
  { id: Category.INDIA, name: '🇮🇳 India', icon: 'flag', color: '#FF9933' },
  { id: Category.SOFTWARE, name: '💻 Software', icon: 'code', color: '#4CAF50' },
  { id: Category.POLITICAL, name: '🏛️ Politics', icon: 'account-balance', color: '#9C27B0' },
  { id: Category.TECH, name: '⚡ Tech', icon: 'devices', color: '#009688' },
  { id: Category.SPORTS, name: '⚽ Sports', icon: 'sports-basketball', color: '#FF5722' },
  { id: Category.BUSINESS, name: '💼 Business', icon: 'business-center', color: '#795548' },
  { id: Category.WORLD, name: '🌍 World', icon: 'language', color: '#607D8B' },
  { id: Category.BREAKING, name: '🔴 Breaking', icon: 'notification-important', color: '#F44336' },
  { id: Category.SCIENCE, name: '🔬 Science', icon: 'science', color: '#3F51B5' },
  { id: Category.AI_ML, name: '🤖 AI/ML', icon: 'psychology', color: '#E91E63' },
  { id: Category.WEB_DEV, name: '🌐 Web Dev', icon: 'web', color: '#00BCD4' },
  { id: Category.MOBILE_DEV, name: '📱 Mobile', icon: 'phone-android', color: '#673AB7' },
  { id: Category.STARTUPS, name: '🚀 Startups', icon: 'trending-up', color: '#FF9800' },
  { id: Category.COOKING, name: '🍳 Cooking', icon: 'restaurant', color: '#FF6F00' },
];

interface CategoryHeaderProps {
  activeCategory: Category;
  onCategoryChange: (categoryId: Category) => void;
  style?: any;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  activeCategory,
  onCategoryChange,
  style,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get('window');


  const handleCategoryPress = (categoryId: Category, index: number) => {
    onCategoryChange(categoryId);
    
    // Auto-scroll to make selected category visible
    if (scrollViewRef.current) {
      const scrollPosition = index * 120 - screenWidth / 2 + 60;
      scrollViewRef.current.scrollTo({ x: Math.max(0, scrollPosition), animated: true });
    }
  };
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={true}
        overScrollMode="always"
        nestedScrollEnabled={true}
      >
        {NEWS_CATEGORIES.map((category, index) => {
          const isActive = activeCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                isActive && [
                  styles.activeCategoryButton,
                  { backgroundColor: category.color || '#2196F3' }
                ],
              ]}
              onPress={() => handleCategoryPress(category.id, index)}
              activeOpacity={0.7}
            >
              <Icon
                name={category.icon}
                size={22}
                color={isActive ? '#FFFFFF' : category.color || '#666666'}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.activeCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    maxHeight: 70,
  },
  scrollView: {
    flexGrow: 0,
    height: 48,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingRight: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  activeCategoryButton: {
    backgroundColor: '#2196F3',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryIcon: {
    marginRight: 7,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
    letterSpacing: 0.2,
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default CategoryHeader;
