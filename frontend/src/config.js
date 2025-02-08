// frontend/src/config.js
const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3306', // Keep only one definition
  websocketUrl: 'ws://localhost:3000', // Your WebSocket server
};

export default config;
