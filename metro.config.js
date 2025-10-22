const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration optimized for Windows development
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Optimize transformer for faster JS processing
  transformer: {
    // Faster minification
    minifierConfig: {
      mangle: {
        keep_fnames: true,
      },
      output: {
        ascii_only: true,
      },
    },
  },

  // Optimize resolver for faster module resolution
  resolver: {
    // Skip expensive platform checks for common extensions
    platforms: ['android', 'native'],
  },

  // Optimize watcher for better performance on Windows
  watchFolders: [],
  
  // Faster file watching on Windows
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Add cache headers for static assets
        if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
