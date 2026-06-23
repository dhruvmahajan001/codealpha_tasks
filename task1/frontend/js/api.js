/**
 * API client helper to interact with the backend server.
 * Automatically injects the JWT token from localStorage.
 */
const API = {
  // Common headers builder
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Handle API responses
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { success: false, message: 'Unexpected server response format' };
    }

    if (!response.ok) {
      // If token has expired or is invalid, clear storage and redirect to login
      if (response.status === 401 && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Session expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  },

  // GET Request
  async get(endpoint) {
    try {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API GET error on ${endpoint}:`, error);
      throw error;
    }
  },

  // POST Request
  async post(endpoint, body = {}) {
    try {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API POST error on ${endpoint}:`, error);
      throw error;
    }
  },

  // PUT Request
  async put(endpoint, body = {}) {
    try {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API PUT error on ${endpoint}:`, error);
      throw error;
    }
  },

  // DELETE Request
  async delete(endpoint) {
    try {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API DELETE error on ${endpoint}:`, error);
      throw error;
    }
  },
};

// Global Toast notification helper (to be used across files)
function showToast(message, type = 'success') {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? '✓' : '✗'}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Trigger animation reflow
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
