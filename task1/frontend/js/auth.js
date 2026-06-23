/**
 * Authentication and User Session Management
 */
const Auth = {
  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get current user information
  getUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  // Check if current user is an admin
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  // Register user
  async register(name, email, password) {
    try {
      const response = await API.post('/auth/register', { name, email, password });
      if (response.success && response.data) {
        this.setSession(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration API Error:', error);
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await API.post('/auth/login', { email, password });
      if (response.success && response.data) {
        this.setSession(response.data);
        // Sync local storage cart to DB upon login
        await Cart.syncLocalCartToDB();
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  },

  // Save session details
  setSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role
    }));
  },

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dbCartSynced'); // Clear sync flag
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  },

  // Update navbar layout dynamically based on auth status
  updateNavbar() {
    const navAuthContainer = document.getElementById('nav-auth-container');
    if (!navAuthContainer) return;

    if (this.isAuthenticated()) {
      const user = this.getUser();
      const adminLink = this.isAdmin() 
        ? `<a href="admin.html" class="nav-link admin-badge">Admin Panel</a>` 
        : '';
      
      navAuthContainer.innerHTML = `
        <div class="user-menu-wrapper">
          ${adminLink}
          <span class="user-greeting">Hi, <strong>${user.name.split(' ')[0]}</strong></span>
          <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
        </div>
      `;

      // Setup logout listener
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }
    } else {
      navAuthContainer.innerHTML = `
        <a href="login.html" class="nav-link">Login</a>
        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
      `;
    }
  }
};

// Auto update navbar on load
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();
});
