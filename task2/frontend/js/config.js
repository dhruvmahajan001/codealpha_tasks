/**
   * ConnectHub Client Configuration
   * Dynamically configures the API base URL depending on the environment.
   */

const CONFIG = {
  // If running locally, connect to local port 5000. Otherwise, point to the production Backend URL.
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://connecthub-backend.onrender.com/api', // Replace with actual Render deployment URL in production

  // Key used to store JWT and user details in LocalStorage
  AUTH_TOKEN_KEY: 'connecthub_token',
  USER_DATA_KEY: 'connecthub_user',
};

// Expose CONFIG globally
window.ConnectHubConfig = CONFIG;
