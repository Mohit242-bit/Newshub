/**
 * Development Configuration for NewsHub
 * This file helps during development when network connectivity is unreliable
 */

export const DEV_CONFIG = {
  // Set to true to prioritize demo data (useful when network is unreliable)
  USE_DEMO_DATA_FIRST: false,
  
  // Set to true to completely bypass network calls in development
  DEMO_MODE_ONLY: false,
  
  // Network timeout for development (shorter for faster fallback)
  NETWORK_TIMEOUT: 5000, // 5 seconds
  
  // Enable detailed logging
  VERBOSE_LOGGING: true,
  
  // Demo data refresh interval (to simulate real data updates)
  DEMO_REFRESH_INTERVAL: 30000, // 30 seconds
};

export const isInDemoMode = (): boolean => {
  return __DEV__ && (DEV_CONFIG.USE_DEMO_DATA_FIRST || DEV_CONFIG.DEMO_MODE_ONLY);
};

export const shouldBypassNetwork = (): boolean => {
  return __DEV__ && DEV_CONFIG.DEMO_MODE_ONLY;
};

export const getNetworkTimeout = (): number => {
  return __DEV__ ? DEV_CONFIG.NETWORK_TIMEOUT : 5000;
};

export const shouldLogVerbose = (): boolean => {
  return __DEV__ && DEV_CONFIG.VERBOSE_LOGGING;
};