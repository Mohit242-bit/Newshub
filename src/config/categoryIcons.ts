import { Category } from '../types/Article';

// Material Icons mapping for each category
// Full list: https://fonts.google.com/icons

export const CATEGORY_ICONS = {
  [Category.ALL]: {
    icon: 'dashboard',
    alternates: ['apps', 'view-module', 'grid-view'],
  },
  [Category.INDIA]: {
    icon: 'location-city',
    alternates: ['flag', 'public', 'place'],
  },
  [Category.SOFTWARE]: {
    icon: 'code',
    alternates: ['terminal', 'developer-mode', 'integration-instructions'],
  },
  [Category.POLITICAL]: {
    icon: 'account-balance',
    alternates: ['how-to-vote', 'gavel', 'policy'],
  },
  [Category.TECH]: {
    icon: 'devices',
    alternates: ['computer', 'memory', 'router'],
  },
  [Category.SPORTS]: {
    icon: 'sports-basketball',
    alternates: ['sports-soccer', 'sports-cricket', 'sports-tennis'],
  },
  [Category.BUSINESS]: {
    icon: 'business-center',
    alternates: ['trending-up', 'show-chart', 'attach-money'],
  },
  [Category.WORLD]: {
    icon: 'language',
    alternates: ['public', 'travel-explore', 'map'],
  },
  [Category.BREAKING]: {
    icon: 'notification-important',
    alternates: ['flash-on', 'priority-high', 'new-releases'],
  },
  [Category.SCIENCE]: {
    icon: 'biotech',
    alternates: ['science', 'psychology', 'explore'],
  },
  [Category.AI_ML]: {
    icon: 'smart-toy',
    alternates: ['psychology', 'memory', 'hub'],
  },
  [Category.WEB_DEV]: {
    icon: 'web-asset',
    alternates: ['web', 'language', 'http'],
  },
  [Category.MOBILE_DEV]: {
    icon: 'phone-android',
    alternates: ['smartphone', 'phone-iphone', 'tablet-android'],
  },
  [Category.STARTUPS]: {
    icon: 'trending-up',
    alternates: ['rocket-launch', 'lightbulb', 'business'],
  },
};

// Category colors with meaning
export const CATEGORY_COLORS = {
  [Category.ALL]: '#2196F3', // Blue - comprehensive
  [Category.INDIA]: '#FF9933', // Saffron - Indian flag color
  [Category.SOFTWARE]: '#4CAF50', // Green - growth/development
  [Category.POLITICAL]: '#9C27B0', // Purple - authority
  [Category.TECH]: '#009688', // Teal - innovation
  [Category.SPORTS]: '#FF5722', // Deep Orange - energy
  [Category.BUSINESS]: '#795548', // Brown - stability
  [Category.WORLD]: '#607D8B', // Blue Grey - global
  [Category.BREAKING]: '#F44336', // Red - urgent
  [Category.SCIENCE]: '#3F51B5', // Indigo - knowledge
  [Category.AI_ML]: '#E91E63', // Pink - futuristic
  [Category.WEB_DEV]: '#00BCD4', // Cyan - web/digital
  [Category.MOBILE_DEV]: '#673AB7', // Deep Purple - mobile
  [Category.STARTUPS]: '#FF9800', // Orange - entrepreneurial
};

// Category display names
export const CATEGORY_NAMES = {
  [Category.ALL]: 'All News',
  [Category.INDIA]: '🇮🇳 India',
  [Category.SOFTWARE]: 'Software',
  [Category.POLITICAL]: 'Politics',
  [Category.TECH]: 'Technology',
  [Category.SPORTS]: 'Sports',
  [Category.BUSINESS]: 'Business',
  [Category.WORLD]: 'World',
  [Category.BREAKING]: '🔴 Breaking',
  [Category.SCIENCE]: 'Science',
  [Category.AI_ML]: 'AI/ML',
  [Category.WEB_DEV]: 'Web Dev',
  [Category.MOBILE_DEV]: 'Mobile',
  [Category.STARTUPS]: 'Startups',
};
