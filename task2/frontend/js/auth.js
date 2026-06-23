/**
 * ConnectHub General Auth & Theme Controller
 * Manages route guards, sidebar profile snippets, and dark mode toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.ConnectHubAPI;
  
  // 1. Initialize Theme (Dark / Light Mode)
  initTheme();

  // 2. Perform Authentication Guard Checks
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');
  const loggedIn = api.isAuthenticated();

  if (isAuthPage && loggedIn) {
    // If logged in, redirect away from register/login pages to home feed
    window.location.href = 'index.html';
    return;
  }

  if (!isAuthPage && !loggedIn) {
    // If not logged in and on a protected page, redirect to login page
    window.location.href = 'login.html';
    return;
  }

  // 3. Populate Logged-In User Information in Sidebar / Navs
  if (loggedIn) {
    updateSidebarUser();
  }

  // 4. Bind Theme Toggle Buttons (if present in DOM)
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // 5. Bind Logout Buttons
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      api.clearSession();
      window.location.href = 'login.html';
    });
  });
});

/**
 * Update the user snippet details in the sidebar menu
 */
function updateSidebarUser() {
  const api = window.ConnectHubAPI;
  const user = api.getCurrentUser();
  if (!user) return;

  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
  const avatarUrl = user.profilePicture || defaultAvatar;

  // Update elements
  const snippetAvatars = document.querySelectorAll('.user-snippet-img, .user-avatar-sm');
  const snippetNames = document.querySelectorAll('.user-snippet-name, .current-user-name');
  const snippetUsernames = document.querySelectorAll('.user-snippet-username, .current-user-username');

  snippetAvatars.forEach(img => {
    img.src = avatarUrl;
    img.alt = user.name;
  });
  
  snippetNames.forEach(el => el.textContent = user.name);
  snippetUsernames.forEach(el => el.textContent = `@${user.username}`);

  // Link sidebar snippet to user's own profile page
  const snippets = document.querySelectorAll('.user-snippet');
  snippets.forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = `profile.html?id=${user._id}`;
    });
  });
}

/**
 * Initialize Light/Dark theme based on LocalStorage or System preferences
 */
function initTheme() {
  const savedTheme = localStorage.getItem('connecthub_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const targetTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', targetTheme);
  updateThemeToggleButtonsUI(targetTheme);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('connecthub_theme', newTheme);
  updateThemeToggleButtonsUI(newTheme);
}

/**
 * Update icon and text of theme toggle buttons based on current state
 */
function updateThemeToggleButtonsUI(theme) {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  themeToggleBtns.forEach(btn => {
    const icon = btn.querySelector('i');
    const text = btn.querySelector('.theme-text');
    
    if (theme === 'dark') {
      if (icon) icon.className = 'fas fa-sun';
      if (text) text.textContent = 'Light Mode';
    } else {
      if (icon) icon.className = 'fas fa-moon';
      if (text) text.textContent = 'Dark Mode';
    }
  });
}

/**
 * Utility helper to format timestamps in a relative human-readable format
 * @param {string|Date} dateString - ISO Date string
 * @returns {string} Relative time string (e.g. "3h ago")
 */
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  // Format as date if older than a week
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Expose formatting helper globally
window.formatTimeAgo = formatTimeAgo;
