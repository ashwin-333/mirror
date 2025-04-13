const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      // Server configuration
      serverPort: process.env.PORT || '5002',
      developerIp: process.env.DEVELOPER_IP || '127.0.0.1',
      
      // API configuration
      apiUrl: process.env.API_URL,
      
      // Other environment variables as needed
      geminiApiKey: process.env.GEMINI_API_KEY,
    },
  };
}; 