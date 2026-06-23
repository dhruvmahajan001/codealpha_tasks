/**
 * ConnectHub Home Feed Controller
 * Manages rendering of posts, likes, comment counts, follow triggers, search, hashtags, suggestions, and post creation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.ConnectHubAPI;
  const user = api.getCurrentUser();
  if (!user) return; // Guarded by auth.js anyway

  // State variables
  let currentSearchQuery = '';
  let selectedBase64Image = '';

  // Setup DOM Elements
  const postsContainer = document.getElementById('posts-container');
  const postContentInput = document.getElementById('post-content');
  const postFileInput = document.getElementById('post-file-input');
  const postImageUrlInput = document.getElementById('post-image-url');
  const toggleUrlBtn = document.getElementById('toggle-url-btn');
  const imageUrlContainer = document.getElementById('image-url-container');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const removePreviewBtn = document.getElementById('remove-preview-btn');
  const submitPostBtn = document.getElementById('submit-post-btn');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const filterBar = document.getElementById('filter-bar');
  const filterQueryText = document.getElementById('filter-query-text');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  const suggestedUsersList = document.getElementById('suggested-users-list');
  const trendingHashtagsList = document.getElementById('trending-hashtags-list');

  // Setup profile links
  const sidebarProfileLink = document.getElementById('sidebar-profile-link');
  const mobileProfileLink = document.getElementById('mobile-profile-link');
  if (sidebarProfileLink) sidebarProfileLink.href = `profile.html?id=${user._id}`;
  if (mobileProfileLink) mobileProfileLink.href = `profile.html?id=${user._id}`;

  // 1. Initial Data Fetching
  fetchFeed();
  fetchTrendingHashtags();
  fetchSuggestedUsers();

  // ==========================================================================
  // Post Creation Handlers
  // ==========================================================================

  // Toggle image URL text input
  toggleUrlBtn.addEventListener('click', () => {
    if (imageUrlContainer.style.display === 'none') {
      imageUrlContainer.style.display = 'block';
      postImageUrlInput.focus();
    } else {
      imageUrlContainer.style.display = 'none';
      postImageUrlInput.value = '';
    }
  });

  // Handle local image selection and convert to Base64
  postFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size is too large! Maximum limit is 5MB.');
      postFileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      selectedBase64Image = event.target.result;
      imagePreview.src = selectedBase64Image;
      imagePreviewContainer.style.display = 'block';
      // Hide URL field if file is loaded
      imageUrlContainer.style.display = 'none';
      postImageUrlInput.value = '';
    };
    reader.readAsDataURL(file);
  });

  // Handle removing previewed image
  removePreviewBtn.addEventListener('click', () => {
    selectedBase64Image = '';
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
    postFileInput.value = '';
  });

  // Create Post Submit
  submitPostBtn.addEventListener('click', async () => {
    const content = postContentInput.value.trim();
    let image = selectedBase64Image || postImageUrlInput.value.trim();

    if (!content) {
      alert('Post content cannot be empty!');
      return;
    }

    submitPostBtn.disabled = true;
    submitPostBtn.querySelector('span').textContent = 'Posting...';

    try {
      const result = await api.request('/posts', 'POST', { content, image });
      if (result.success) {
        // Reset form inputs
        postContentInput.value = '';
        selectedBase64Image = '';
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
        postFileInput.value = '';
        postImageUrlInput.value = '';
        imageUrlContainer.style.display = 'none';

        // Reload feed
        fetchFeed();
      }
    } catch (error) {
      alert(error.message || 'Failed to publish post');
    } finally {
      submitPostBtn.disabled = false;
      submitPostBtn.querySelector('span').textContent = 'Post';
    }
  });

  // ==========================================================================
  // Fetching & Rendering Feed Posts
  // ==========================================================================

  async function fetchFeed(searchQuery = '') {
    postsContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--accent-primary); margin-bottom: 1rem;"></i>
        <p style="color: var(--text-secondary);">Updating Home Feed...</p>
      </div>
    `;

    try {
      const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await api.request(`/posts${queryParam}`);
      
      if (response.success) {
        renderPosts(response.data);
      }
    } catch (error) {
      postsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; border-color: var(--danger-color);">
          <i class="fas fa-exclamation-triangle fa-2x" style="color: var(--danger-color); margin-bottom: 1rem;"></i>
          <p style="color: var(--text-secondary);">Could not load posts feed. Make sure the backend server is running.</p>
        </div>
      `;
    }
  }

  function renderPosts(posts) {
    if (!posts || posts.length === 0) {
      postsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <i class="far fa-comments fa-2x" style="color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p style="color: var(--text-secondary);">No posts found. Start the conversation by publishing a new post!</p>
        </div>
      `;
      return;
    }

    postsContainer.innerHTML = '';
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    posts.forEach(post => {
      const postCard = document.createElement('article');
      postCard.className = 'card post-card';
      postCard.dataset.id = post._id;

      const isLikedByMe = post.likes.includes(user._id);
      const isMyPost = post.author._id === user._id;

      // Handle profile picture
      const authorAvatar = post.author.profilePicture || defaultAvatar;

      // Detect if user is following this author (we need to check user's profile following array)
      // Since it requires a network request to check individual follow state, we'll check profile or check suggestions.
      // We can also check if current user profile details are populated. Let's make follow button visible only if not self.
      // To keep it simple and elegant, we show the follow button if they aren't the author. We'll handle follow toggling beautifully.
      let followBtnHTML = '';
      if (!isMyPost) {
        // If we want to hide it if we are already following, we can query localStorage or dynamically set.
        // We'll query if the author ID is in user's following list (fetched on init or stored in session).
        // Let's store following list in localStorage user data, or check it.
        const currentLocalUser = api.getCurrentUser();
        const isFollowing = currentLocalUser.following && currentLocalUser.following.includes(post.author._id);
        
        if (!isFollowing) {
          followBtnHTML = `
            <button class="btn btn-secondary btn-sm follow-btn" data-author-id="${post.author._id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
              <i class="fas fa-user-plus"></i> Follow
            </button>
          `;
        }
      }

      // Generate Post Content with clickable hashtags
      const formattedContent = post.content.replace(/#(\w+)/g, '<span class="hashtag-filter" style="color: var(--accent-primary); cursor: pointer; font-weight: 500;">#$1</span>');

      postCard.innerHTML = `
        <div class="post-header">
          <div class="post-author" onclick="window.location.href='profile.html?id=${post.author._id}'">
            <img class="user-avatar-sm" src="${authorAvatar}" alt="${post.author.name}">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="post-author-name">${post.author.name}</span>
                <span class="post-author-username">@${post.author.username}</span>
              </div>
              <span class="post-timestamp">${window.formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${followBtnHTML}
            
            ${isMyPost ? `
              <div class="post-dropdown-container">
                <button class="post-menu-btn"><i class="fas fa-ellipsis-v"></i></button>
                <div class="dropdown-menu">
                  <button class="dropdown-item edit-post-btn"><i class="fas fa-edit"></i> Edit</button>
                  <button class="dropdown-item delete dropdown-item delete-post-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="post-body">${formattedContent}</div>

        ${post.image ? `
          <div class="post-image-container">
            <img class="post-image" src="${post.image}" alt="Post attachment">
          </div>
        ` : ''}

        <div class="post-actions">
          <button class="post-action-btn like-post-btn ${isLikedByMe ? 'liked' : ''}">
            <i class="${isLikedByMe ? 'fas' : 'far'} fa-heart"></i>
            <span class="likes-count">${post.likes.length}</span>
          </button>
          <button class="post-action-btn comment-btn" onclick="window.location.href='post.html?id=${post._id}'">
            <i class="far fa-comment"></i>
            <span>${post.comments ? post.comments.length : 0}</span>
          </button>
        </div>
      `;

      // Bind events to post elements
      bindPostCardEvents(postCard, post);

      postsContainer.appendChild(postCard);
    });
  }

  function bindPostCardEvents(card, post) {
    // Like button toggle
    const likeBtn = card.querySelector('.like-post-btn');
    likeBtn.addEventListener('click', async () => {
      const isLiked = likeBtn.classList.contains('liked');
      const method = isLiked ? 'unlike' : 'like';
      
      try {
        const result = await api.request(`/posts/${post._id}/${method}`, 'POST');
        if (result.success) {
          likeBtn.classList.toggle('liked');
          const icon = likeBtn.querySelector('i');
          icon.className = !isLiked ? 'fas fa-heart' : 'far fa-heart';
          likeBtn.querySelector('.likes-count').textContent = result.likesCount;
        }
      } catch (error) {
        console.error('Like request failed:', error.message);
      }
    });

    // Follow button click
    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const authorId = followBtn.dataset.authorId;
        
        try {
          const result = await api.request(`/users/follow/${authorId}`, 'POST');
          if (result.success) {
            // Update following list in current user object
            const currentUserObj = api.getCurrentUser();
            if (!currentUserObj.following) currentUserObj.following = [];
            currentUserObj.following.push(authorId);
            localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(currentUserObj));
            
            // Remove follow buttons for this author across the feed
            document.querySelectorAll(`.follow-btn[data-author-id="${authorId}"]`).forEach(btn => {
              btn.remove();
            });
            fetchSuggestedUsers(); // Refresh suggestions too
          }
        } catch (error) {
          alert(error.message || 'Failed to follow user');
        }
      });
    }

    // Dropdown toggle (for self posts)
    const menuBtn = card.querySelector('.post-menu-btn');
    if (menuBtn) {
      const menu = card.querySelector('.dropdown-menu');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns first
        document.querySelectorAll('.dropdown-menu.show').forEach(m => {
          if (m !== menu) m.classList.remove('show');
        });
        menu.classList.toggle('show');
      });

      // Delete post click
      const deleteBtn = card.querySelector('.delete-post-btn');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
          try {
            const result = await api.request(`/posts/${post._id}`, 'DELETE');
            if (result.success) {
              card.remove();
            }
          } catch (error) {
            alert(error.message || 'Failed to delete post');
          }
        }
      });

      // Edit post click
      const editBtn = card.querySelector('.edit-post-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newContent = prompt('Edit your post:', post.content);
        if (newContent !== null && newContent.trim() !== '') {
          editPost(post._id, newContent.trim(), card);
        }
      });
    }

    // Hashtag clicks
    card.querySelectorAll('.hashtag-filter').forEach(tagSpan => {
      tagSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = tagSpan.textContent;
        applyQueryFilter(tag);
      });
    });
  }

  // Close dropdowns on document click
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
  });

  // Edit Post helper
  async function editPost(postId, content, card) {
    try {
      const result = await api.request(`/posts/${postId}`, 'PUT', { content });
      if (result.success) {
        // Update content body on the DOM instantly
        const formatted = content.replace(/#(\w+)/g, '<span class="hashtag-filter" style="color: var(--accent-primary); cursor: pointer; font-weight: 500;">#$1</span>');
        card.querySelector('.post-body').innerHTML = formatted;
        // Bind hashtag click events again
        card.querySelectorAll('.hashtag-filter').forEach(tagSpan => {
          tagSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            applyQueryFilter(tagSpan.textContent);
          });
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to edit post');
    }
  }

  // ==========================================================================
  // Searching & Filters
  // ==========================================================================

  function applyQueryFilter(query) {
    currentSearchQuery = query;
    searchInput.value = query;
    filterQueryText.textContent = query;
    filterBar.style.display = 'flex';
    fetchFeed(query);
  }

  clearFilterBtn.addEventListener('click', () => {
    currentSearchQuery = '';
    searchInput.value = '';
    filterBar.style.display = 'none';
    fetchFeed();
  });

  // Search input listeners
  searchBtn.addEventListener('click', () => {
    const val = searchInput.value.trim();
    if (val) {
      applyQueryFilter(val);
    } else {
      currentSearchQuery = '';
      filterBar.style.display = 'none';
      fetchFeed();
    }
  });

  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const val = searchInput.value.trim();
      if (val) {
        applyQueryFilter(val);
      } else {
        currentSearchQuery = '';
        filterBar.style.display = 'none';
        fetchFeed();
      }
    }
  });

  // ==========================================================================
  // Trending & Suggested Widgets
  // ==========================================================================

  async function fetchTrendingHashtags() {
    try {
      const response = await api.request('/posts/trending');
      if (response.success && trendingHashtagsList) {
        renderTrendingHashtags(response.data);
      }
    } catch (error) {
      trendingHashtagsList.innerHTML = `<p class="trending-count">Could not load trends</p>`;
    }
  }

  function renderTrendingHashtags(tags) {
    if (!tags || tags.length === 0) {
      trendingHashtagsList.innerHTML = `<p class="trending-count" style="padding:0.5rem 0;">No trending hashtags yet</p>`;
      return;
    }

    trendingHashtagsList.innerHTML = '';
    tags.forEach(item => {
      const el = document.createElement('div');
      el.className = 'trending-item';
      el.innerHTML = `
        <span class="trending-tag">${item.tag}</span>
        <span class="trending-count">${item.count} ${item.count === 1 ? 'post' : 'posts'}</span>
      `;
      el.addEventListener('click', () => {
        applyQueryFilter(item.tag);
      });
      trendingHashtagsList.appendChild(el);
    });
  }

  async function fetchSuggestedUsers() {
    try {
      const response = await api.request('/users/suggestions');
      if (response.success && suggestedUsersList) {
        renderSuggestedUsers(response.data);
      }
    } catch (error) {
      suggestedUsersList.innerHTML = `<p class="trending-count">Could not load suggestions</p>`;
    }
  }

  function renderSuggestedUsers(users) {
    if (!users || users.length === 0) {
      suggestedUsersList.innerHTML = `<p class="trending-count" style="padding:0.5rem 0;">You're following everyone!</p>`;
      return;
    }

    suggestedUsersList.innerHTML = '';
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    users.forEach(item => {
      const userDiv = document.createElement('div');
      userDiv.className = 'suggested-user';

      const avatar = item.profilePicture || defaultAvatar;

      userDiv.innerHTML = `
        <div class="user-info-row" onclick="window.location.href='profile.html?id=${item._id}'">
          <img class="user-avatar-sm" src="${avatar}" alt="${item.name}">
          <div class="user-info-text">
            <span class="user-name">${item.name}</span>
            <span class="user-username">@${item.username}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm widget-follow-btn" data-id="${item._id}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">
          <i class="fas fa-plus"></i> Follow
        </button>
      `;

      // Widget follow button event
      const wFollowBtn = userDiv.querySelector('.widget-follow-btn');
      wFollowBtn.addEventListener('click', async () => {
        try {
          const result = await api.request(`/users/follow/${item._id}`, 'POST');
          if (result.success) {
            // Update local storage user data
            const currentUserObj = api.getCurrentUser();
            if (!currentUserObj.following) currentUserObj.following = [];
            currentUserObj.following.push(item._id);
            localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(currentUserObj));

            // Remove user from suggestions instantly
            userDiv.remove();
            
            // Reload feed to remove follow buttons for this user if present
            fetchFeed(currentSearchQuery);
            fetchSuggestedUsers(); // Refresh self suggestions
          }
        } catch (error) {
          alert(error.message || 'Failed to follow user');
        }
      });

      suggestedUsersList.appendChild(userDiv);
    });
  }
});
