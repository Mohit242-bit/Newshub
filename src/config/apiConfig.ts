/**
 * API Configuration for NewsHub
 * 
 * This file stores API keys that are compiled into the APK.
 * Keys are read from environment variables during build time.
 */

export const API_CONFIG = {
  // NewsAPI key - Sign up at https://newsapi.org/
  NEWSAPI_KEY: '74efa1095b4f4e66b201bc488ad62b01',
  
  // Guardian API key - Sign up at https://open.theguardian.com/documentation/
  GUARDIAN_API_KEY: '71697062-0048-4756-b7eb-18602040086a',
  
  ESPN_KEY: '',
  DEVTO_KEY: '',
  HACKERNEWS_KEY: '',
};

export const validateApiKeys = () => {
  const missingKeys = [];

  if (!API_CONFIG.NEWSAPI_KEY || API_CONFIG.NEWSAPI_KEY === 'demo') {
    missingKeys.push('NEWSAPI_KEY');
  }
  if (!API_CONFIG.GUARDIAN_API_KEY || API_CONFIG.GUARDIAN_API_KEY === 'test') {
    missingKeys.push('GUARDIAN_API_KEY');
  }

  return {
    valid: missingKeys.length === 0,
    missingKeys,
  };
};

export default API_CONFIG;
