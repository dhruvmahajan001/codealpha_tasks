/**
 * ConnectHub Central API Wrapper
 * Handles network requests, headers, tokens, and errors.
 */

const API = {
  /**
   * Perform an HTTP fetch call to the backend API
   * @param {string} endpoint - API path (e.g. '/posts', '/auth/login')
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object|null} body - Request payload (will be stringified to JSON)
   * @param {boolean} requiresAuth - Whether the endpoint requires authentication token
   */
  async request(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const config = window.ConnectHubConfig;
    const url = `${config.API_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    // Attach JWT token if required and present
    if (requiresAuth) {
      const token = localStorage.getItem(config.AUTH_TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized (token invalid/expired), clear session and redirect
        if (response.status === 401 && requiresAuth) {
          console.warn('Session expired or unauthorized. Redirecting to login...');
          localStorage.removeItem(config.AUTH_TOKEN_KEY);
          localStorage.removeItem(config.USER_DATA_KEY);
          window.location.href = 'login.html';
        }
        
        throw new Error(data.message || `API error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request Failed [${method} ${endpoint}]:`, error.message);
      throw error;
    }
  },

  // Helper getters/setters for session
  getToken() {
    return localStorage.getItem(window.ConnectHubConfig.AUTH_TOKEN_KEY);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(window.ConnectHubConfig.USER_DATA_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  setSession(token, user) {
    localStorage.setItem(window.ConnectHubConfig.AUTH_TOKEN_KEY, token);
    localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(window.ConnectHubConfig.AUTH_TOKEN_KEY);
    localStorage.removeItem(window.ConnectHubConfig.USER_DATA_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

// Expose API globally
window.ConnectHubAPI = API;
