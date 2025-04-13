/**
 * Environment variables utility
 */

// For React Native, you might need to install react-native-dotenv
// To install: npm install react-native-dotenv --save-dev
// Then update babel.config.js as needed

import { GEMINI_API_KEY as API_KEY } from '@env';

export const GEMINI_API_KEY = API_KEY || '';

// Helper to check if API keys are configured
export const isGeminiApiKeyConfigured = (): boolean => {
  return GEMINI_API_KEY !== '' && GEMINI_API_KEY !== 'your_api_key_here';
}; 