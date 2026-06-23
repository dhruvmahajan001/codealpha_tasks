/**
 * ConnectHub Profile Page Controller
 * Handles loading stats, checking follow connections, filtering user posts, and modal edit profile requests.
 */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.ConnectHubAPI;
  const loggedInUser = api.getCurrentUser();
  if (!loggedInUser) return;

  // Extract Profile ID from URL Query (?id=xxxx)
  const urlParams = new URLSearchParams(window.location.search);
  let targetProfileId = urlParams.get('id');

  // If no ID in URL, default to logged-in user's profile
  if (!targetProfileId) {
    targetProfileId = loggedInUser._id;
    // Update URL quietly without reloading
    window.history.replaceState({}, '', `profile.html?id=${targetProfileId}`);
  }

  // Setup DOM Elements
  const postsContainer = document.getElementById('posts-container');
  const profilePicDisplay = document.getElementById('profile-picture-display');
  const profileNameDisplay = document.getElementById('profile-name-display');
  const profileUsernameDisplay = document.getElementById('profile-username-display');
  const profileBioDisplay = document.getElementById('profile-bio-display');
  const postCountVal = document.getElementById('post-count-val');
  const followerCountVal = document.getElementById('follower-count-val');
  const followingCountVal = document.getElementById('following-count-val');
  const actionsContainer = document.getElementById('profile-actions-container');
  const suggestedUsersList = document.getElementById('suggested-users-list');

  // Modal elements
  const editProfileModal = document.getElementById('edit-profile-modal');
  const editProfileForm = document.getElementById('edit-profile-form');
  const closeModelBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const editNameInput = document.getElementById('edit-name');
  const editBioInput = document.getElementById('edit-bio');
  const editAvatarUrlInput = document.getElementById('edit-avatar-url');
  const avatarFileInput = document.getElementById('avatar-file-input');
  const modalAvatarPreview = document.getElementById('modal-avatar-preview');
  const saveProfileBtn = document.getElementById('save-profile-btn');

  // Setup profile links for navigation
  const sidebarProfileLink = document.getElementById('sidebar-profile-link');
  const mobileProfileLink = document.getElementById('mobile-profile-link');
  if (sidebarProfileLink) sidebarProfileLink.href = `profile.html?id=${loggedInUser._id}`;
  if (mobileProfileLink) mobileProfileLink.href = `profile.html?id=${loggedInUser._id}`;

  let currentProfileData = null;
  let modalSelectedBase64Avatar = '';

  // 1. Fetch Profile Data
  loadProfile();
  loadSuggestedUsers();

  // ==========================================================================
  // Fetching User Profile Information
  // ==========================================================================

  async function loadProfile() {
    try {
      const response = await api.request(`/users/profile/${targetProfileId}`);
      if (response.success) {
        currentProfileData = response.data;
        renderProfileHeader(response.data);
        fetchUserPosts();
      }
    } catch (error) {
      console.error(error);
      postsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; border-color: var(--danger-color);">
          <i class="fas fa-user-slash fa-2x" style="color: var(--danger-color); margin-bottom: 1rem;"></i>
          <p style="color: var(--text-secondary);">User profile not found. Make sure the ID is valid.</p>
        </div>
      `;
    }
  }

  function renderProfileHeader(data) {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    
    // Fill values
    profilePicDisplay.src = data.profilePicture || defaultAvatar;
    profileNameDisplay.textContent = data.name;
    profileUsernameDisplay.textContent = `@${data.username}`;
    profileBioDisplay.textContent = data.bio || 'No bio description added yet.';
    
    // Stats
    postCountVal.textContent = data.postCount;
    followerCountVal.textContent = data.followersCount;
    followingCountVal.textContent = data.followingCount;

    // Clear actions
    actionsContainer.innerHTML = '';

    const isSelfProfile = data._id === loggedInUser._id;

    if (isSelfProfile) {
      // Create Edit Profile button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.innerHTML = `<i class="fas fa-edit"></i> Edit Profile`;
      editBtn.addEventListener('click', openEditModal);
      actionsContainer.appendChild(editBtn);
    } else {
      // Check if logged-in user is already following this user
      // data.followers contains a list of populated follower users, check by matching user IDs
      const isFollowing = data.followers.some(f => f._id === loggedInUser._id);
      
      const followBtn = document.createElement('button');
      if (isFollowing) {
        followBtn.className = 'btn btn-secondary btn-sm';
        followBtn.innerHTML = `<i class="fas fa-user-minus"></i> Unfollow`;
        followBtn.addEventListener('click', () => handleFollowToggle('unfollow'));
      } else {
        followBtn.className = 'btn btn-primary btn-sm';
        followBtn.innerHTML = `<i class="fas fa-user-plus"></i> Follow`;
        followBtn.addEventListener('click', () => handleFollowToggle('follow'));
      }
      actionsContainer.appendChild(followBtn);
    }
  }

  // Handle Follow/Unfollow Click
  async function handleFollowToggle(action) {
    try {
      const result = await api.request(`/users/${action}/${targetProfileId}`, 'POST');
      if (result.success) {
        // Toggle the button and counts by reloading profile details
        loadProfile();

        // Sync local storage user following list
        const currentUserObj = api.getCurrentUser();
        if (!currentUserObj.following) currentUserObj.following = [];
        if (action === 'follow') {
          currentUserObj.following.push(targetProfileId);
        } else {
          currentUserObj.following = currentUserObj.following.filter(id => id !== targetProfileId);
        }
        localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(currentUserObj));
        loadSuggestedUsers(); // Refresh suggestions
      }
    } catch (error) {
      alert(error.message || `Failed to ${action} user`);
    }
  }

  // ==========================================================================
  // Fetch and Render User Specific Feed Posts
  // ==========================================================================

  async function fetchUserPosts() {
    try {
      // Get all posts and filter for this user
      const response = await api.request('/posts');
      if (response.success) {
        const filteredPosts = response.data.filter(p => p.author._id === targetProfileId);
        renderPosts(filteredPosts);
      }
    } catch (error) {
      console.error(error);
      postsContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Could not load posts.</p>`;
    }
  }

  function renderPosts(posts) {
    if (!posts || posts.length === 0) {
      postsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <i class="far fa-images fa-2x" style="color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p style="color: var(--text-secondary);">No posts published by this user yet.</p>
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

      const isLikedByMe = post.likes.includes(loggedInUser._id);
      const isMyPost = post.author._id === loggedInUser._id;
      const authorAvatar = post.author.profilePicture || defaultAvatar;

      const formattedContent = post.content.replace(/#(\w+)/g, '<span class="hashtag-filter" style="color: var(--accent-primary); cursor: pointer; font-weight: 500;">#$1</span>');

      postCard.innerHTML = `
        <div class="post-header">
          <div class="post-author">
            <img class="user-avatar-sm" src="${authorAvatar}" alt="${post.author.name}">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="post-author-name">${post.author.name}</span>
                <span class="post-author-username">@${post.author.username}</span>
              </div>
              <span class="post-timestamp">${window.formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>

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

      bindPostEvents(postCard, post);
      postsContainer.appendChild(postCard);
    });
  }

  function bindPostEvents(card, post) {
    // Like button
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
        console.error(error.message);
      }
    });

    // Self-post Dropdowns
    const menuBtn = card.querySelector('.post-menu-btn');
    if (menuBtn) {
      const menu = card.querySelector('.dropdown-menu');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-menu.show').forEach(m => {
          if (m !== menu) m.classList.remove('show');
        });
        menu.classList.toggle('show');
      });

      // Delete post click
      const deleteBtn = card.querySelector('.delete-post-btn');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this post?')) {
          try {
            const result = await api.request(`/posts/${post._id}`, 'DELETE');
            if (result.success) {
              card.remove();
              // Update posts count displayed on profile header
              loadProfile();
            }
          } catch (error) {
            alert(error.message);
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

    // Hashtag clicks redirects to home feed with filter
    card.querySelectorAll('.hashtag-filter').forEach(tagSpan => {
      tagSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `index.html?search=${encodeURIComponent(tagSpan.textContent)}`;
      });
    });
  }

  // Close dropdowns on click
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
  });

  async function editPost(postId, content, card) {
    try {
      const result = await api.request(`/posts/${postId}`, 'PUT', { content });
      if (result.success) {
        const formatted = content.replace(/#(\w+)/g, '<span class="hashtag-filter" style="color: var(--accent-primary); cursor: pointer; font-weight: 500;">#$1</span>');
        card.querySelector('.post-body').innerHTML = formatted;
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // ==========================================================================
  // Edit Profile Modal Handlers
  // ==========================================================================

  function openEditModal() {
    if (!currentProfileData) return;

    editNameInput.value = currentProfileData.name;
    editBioInput.value = currentProfileData.bio || '';
    editAvatarUrlInput.value = currentProfileData.profilePicture || '';
    modalAvatarPreview.src = currentProfileData.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    modalSelectedBase64Avatar = '';

    editProfileModal.classList.add('show');
  }

  function closeEditModal() {
    editProfileModal.classList.remove('show');
    editProfileForm.reset();
  }

  closeModelBtn.addEventListener('click', closeEditModal);
  cancelModalBtn.addEventListener('click', closeEditModal);

  // Read selected avatar file as Base64
  avatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar image is too large! Maximum limit is 2MB.');
      avatarFileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      modalSelectedBase64Avatar = event.target.result;
      modalAvatarPreview.src = modalSelectedBase64Avatar;
      editAvatarUrlInput.value = ''; // Reset text input
    };
    reader.readAsDataURL(file);
  });

  // Handle URL change to update preview instantly
  editAvatarUrlInput.addEventListener('input', () => {
    const val = editAvatarUrlInput.value.trim();
    if (val) {
      modalAvatarPreview.src = val;
      modalSelectedBase64Avatar = ''; // Reset local file selection
      avatarFileInput.value = '';
    }
  });

  // Save changes submit
  editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = editNameInput.value.trim();
    const bio = editBioInput.value.trim();
    const profilePicture = modalSelectedBase64Avatar || editAvatarUrlInput.value.trim() || '';

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Saving...';

    try {
      const response = await api.request('/users/profile', 'PUT', {
        name,
        bio,
        profilePicture
      });

      if (response.success) {
        // Sync local storage user details
        const cachedUser = api.getCurrentUser();
        cachedUser.name = response.data.name;
        cachedUser.bio = response.data.bio;
        cachedUser.profilePicture = response.data.profilePicture;
        localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(cachedUser));

        // Close modal and reload page profile info
        closeEditModal();
        loadProfile();
        
        // Refresh sidebar info too
        if (typeof window.updateSidebarUser === 'function') {
          window.updateSidebarUser();
        } else {
          // If updateSidebarUser is not exposed globally, we reload to sync
          window.location.reload();
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to update profile details');
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = 'Save Changes';
    }
  });

  // ==========================================================================
  // Suggestions Widget loading
  // ==========================================================================

  async function loadSuggestedUsers() {
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
      suggestedUsersList.innerHTML = `<p class="trending-count" style="padding:0.5rem 0;">No suggestions available</p>`;
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

            // Refresh Profile (if we followed someone on our suggestions list, follow stats might change if they follow us back)
            loadProfile();
            loadSuggestedUsers();
          }
        } catch (error) {
          alert(error.message || 'Failed to follow user');
        }
      });

      suggestedUsersList.appendChild(userDiv);
    });
  }

});
