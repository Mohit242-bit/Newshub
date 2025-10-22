#  NewsHub - Multi-Source News Aggregator

A modern React Native news aggregation app that brings together the best news from multiple reliable sources, with intelligent fallbacks and real-time updates.

##  Project Overview

**NewsHub** is a fully functional multi-source news aggregator built with React Native and TypeScript. It aggregates news from 6+ different sources across multiple categories including Technology, Sports, Politics, Indian News, Business, and more.

### Key Features
-  **Multi-Source Aggregation** - Combines articles from 6+ news sources
-  **Smart Fallbacks** - Intelligent fallback chains ensure content is always available
-  **Real-Time Updates** - Fresh content every 10 minutes via caching
-  **Fast Performance** - < 1.5 second load times even with fallbacks
-  **Offline Support** - Cached articles available when offline
-  **Article Diversity** - No duplicates, diverse sources, shuffle algorithm
-  **In-App Debugging** - Built-in debug panel for service testing
-  **TypeScript** - Full type safety for reliability

##  Getting Started

### Prerequisites
- Node.js >= 20
- Android Studio or Xcode
- Android SDK or iOS CocoaPods

### Running the App

`ash
# Terminal 1 - Start Metro
npm start

# Terminal 2 - Run on Android
npm run android
`

##  Architecture

### News Sources by Category

| Category | Primary | Fallback 1 | Fallback 2 |
|----------|---------|-----------|-----------|
| **Software/Tech** | Dev.to API | Hacker News | NewsAPI |
| **Sports** | NewsAPI | ESPN RSS | Guardian |
| **Politics** | Guardian API | Indian RSS | - |
| **India** | NewsAPI | 6 RSS feeds | Guardian |
| **Breaking** | NewsAPI | Guardian | Indian RSS |

##  Current Status

### Completed 
- [x] Multi-source service architecture
- [x] 6+ news sources integrated  
- [x] Intelligent fallback chains
- [x] Performance optimizations
- [x] Article diversity algorithm
- [x] Error handling with retry logic
- [x] Caching with AsyncStorage
- [x] React Navigation setup
- [x] TypeScript type safety
- [x] Debug panel for testing

### Future Roadmap 
- [ ] Article detail screen with full content
- [ ] Search functionality
- [ ] Bookmarks/Favorites
- [ ] Push notifications for breaking news
- [ ] Dark mode
- [ ] Article sharing

##  Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Detailed current status and achievements
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - Technical improvements made
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

**Last Updated:** October 2025 | **Status:** Production Ready
