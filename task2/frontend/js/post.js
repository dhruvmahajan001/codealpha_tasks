/**
 * ConnectHub Post Details Thread Controller
 * Handles loading individual thread details, comment submission, likes toggles, and deletion/editing.
 */

document.addEventListener('DOMContentLoaded', () => {
  const api = window.ConnectHubAPI;
  const loggedInUser = api.getCurrentUser();
  if (!loggedInUser) return;

  // Extract Post ID from URL Query (?id=xxxx)
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    window.location.href = 'index.html';
    return;
  }

  // Setup DOM Elements
  const postDetailCard = document.getElementById('post-detail-card');
  const suggestedUsersList = document.getElementById('suggested-users-list');

  // Setup profile links for navigation
  const sidebarProfileLink = document.getElementById('sidebar-profile-link');
  const mobileProfileLink = document.getElementById('mobile-profile-link');
  if (sidebarProfileLink) sidebarProfileLink.href = `profile.html?id=${loggedInUser._id}`;
  if (mobileProfileLink) mobileProfileLink.href = `profile.html?id=${loggedInUser._id}`;

  let currentPostData = null;

  // Load thread data
  loadThread();
  loadSuggestedUsers();

  // ==========================================================================
  // Fetch and Render Thread Details
  // ==========================================================================

  async function loadThread() {
    try {
      const response = await api.request(`/posts/${postId}`);
      if (response.success) {
        currentPostData = response.data;
        renderThread(response.data);
      }
    } catch (error) {
      console.error(error);
      postDetailCard.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; border-color: var(--danger-color);">
          <i class="fas fa-exclamation-circle fa-2x" style="color: var(--danger-color); margin-bottom: 1rem;"></i>
          <p style="color: var(--text-secondary);">Could not load post details. Thread may have been deleted.</p>
        </div>
      `;
    }
  }

  function renderThread(post) {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    const isLikedByMe = post.likes.includes(loggedInUser._id);
    const isMyPost = post.author._id === loggedInUser._id;
    const authorAvatar = post.author.profilePicture || defaultAvatar;

    // Detect if user is following this author
    let followBtnHTML = '';
    if (!isMyPost) {
      const isFollowing = loggedInUser.following && loggedInUser.following.includes(post.author._id);
      if (!isFollowing) {
        followBtnHTML = `
          <button class="btn btn-secondary btn-sm follow-btn" data-author-id="${post.author._id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
            <i class="fas fa-user-plus"></i> Follow
          </button>
        `;
      }
    }

    // Format content with hashtags
    const formattedContent = post.content.replace(/#(\w+)/g, '<span class="hashtag-filter" style="color: var(--accent-primary); cursor: pointer; font-weight: 500;">#$1</span>');

    postDetailCard.innerHTML = `
      <!-- Main Post Card -->
      <div class="card post-card" style="margin-bottom: 0;">
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

        <div class="post-body" style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem;">${formattedContent}</div>

        ${post.image ? `
          <div class="post-image-container" style="max-height: 500px; margin-bottom: 1rem;">
            <img class="post-image" src="${post.image}" alt="Post attachment">
          </div>
        ` : ''}

        <div class="post-actions" style="margin-bottom: 0;">
          <button class="post-action-btn like-post-btn ${isLikedByMe ? 'liked' : ''}" style="font-size: 0.95rem;">
            <i class="${isLikedByMe ? 'fas' : 'far'} fa-heart"></i>
            <span class="likes-count">${post.likes.length}</span>
          </button>
          <div class="post-action-btn" style="cursor: default; font-size: 0.95rem;">
            <i class="far fa-comment"></i>
            <span id="comments-count-badge">${post.comments ? post.comments.length : 0}</span>
          </div>
        </div>
      </div>

      <!-- Add Comment Card -->
      <div class="card" style="padding: 1.25rem;">
        <div class="comment-input-container" style="margin-bottom: 0;">
          <img class="comment-avatar" src="${loggedInUser.profilePicture || defaultAvatar}" alt="${loggedInUser.name}">
          <textarea id="comment-content" class="comment-textarea" placeholder="Add a comment to this thread..." maxlength="280"></textarea>
          <button id="submit-comment-btn" class="btn btn-primary btn-sm" style="height: fit-content; align-self: flex-end;">
            <span>Reply</span>
            <i class="fas fa-comment"></i>
          </button>
        </div>
      </div>

      <!-- Comments List Header -->
      <div class="comments-section" style="border:none; margin-top:0.5rem; padding-top:0;">
        <h3 class="comments-header">Comments</h3>
        <div class="comments-list" id="comments-list-container">
          <!-- Comments injected dynamically -->
        </div>
      </div>
    `;

    // Bind thread events
    bindThreadEvents(postDetailCard, post);
    renderComments(post.comments);
  }

  function bindThreadEvents(card, post) {
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

    // Follow button click
    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const authorId = followBtn.dataset.authorId;
        
        try {
          const result = await api.request(`/users/follow/${authorId}`, 'POST');
          if (result.success) {
            const currentUserObj = api.getCurrentUser();
            if (!currentUserObj.following) currentUserObj.following = [];
            currentUserObj.following.push(authorId);
            localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(currentUserObj));
            
            followBtn.remove();
            loadSuggestedUsers();
          }
        } catch (error) {
          alert(error.message || 'Failed to follow user');
        }
      });
    }

    // Dropdown Actions (if self post)
    const menuBtn = card.querySelector('.post-menu-btn');
    if (menuBtn) {
      const menu = card.querySelector('.dropdown-menu');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      // Delete post click
      const deleteBtn = card.querySelector('.delete-post-btn');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this post thread?')) {
          try {
            const result = await api.request(`/posts/${post._id}`, 'DELETE');
            if (result.success) {
              window.location.href = 'index.html';
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

    // Submit Comment button click
    const commentInput = card.querySelector('#comment-content');
    const commentSubmitBtn = card.querySelector('#submit-comment-btn');
    commentSubmitBtn.addEventListener('click', async () => {
      const content = commentInput.value.trim();
      if (!content) return;

      commentSubmitBtn.disabled = true;
      commentSubmitBtn.querySelector('span').textContent = 'Replying...';

      try {
        const result = await api.request(`/posts/${post._id}/comment`, 'POST', { content });
        if (result.success) {
          commentInput.value = '';
          // Render new comment instantly at top of comments list
          prependComment(result.data);
          // Increase comments count displayed
          const badge = document.getElementById('comments-count-badge');
          if (badge) {
            badge.textContent = parseInt(badge.textContent) + 1;
          }
        }
      } catch (error) {
        alert(error.message || 'Failed to submit comment');
      } finally {
        commentSubmitBtn.disabled = false;
        commentSubmitBtn.querySelector('span').textContent = 'Reply';
      }
    });

    // Close dropdowns on document click
    document.addEventListener('click', () => {
      if (menuBtn) {
        const menu = card.querySelector('.dropdown-menu');
        menu.classList.remove('show');
      }
    });

    // Hashtag clicks
    card.querySelectorAll('.hashtag-filter').forEach(tagSpan => {
      tagSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `index.html?search=${encodeURIComponent(tagSpan.textContent)}`;
      });
    });
  }

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
  // Comments List Handlers
  // ==========================================================================

  function renderComments(comments) {
    const listContainer = document.getElementById('comments-list-container');
    if (!listContainer) return;

    if (!comments || comments.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem;">
          <p style="color: var(--text-secondary);">No comments on this thread yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = '';
    
    // Sort comments by newest first
    const sorted = [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    sorted.forEach(c => {
      const el = createCommentCardHTML(c, defaultAvatar);
      listContainer.appendChild(el);
    });
  }

  function prependComment(comment) {
    const listContainer = document.getElementById('comments-list-container');
    if (!listContainer) return;

    // Remove empty comments card message if it exists
    if (listContainer.querySelector('p') && listContainer.querySelector('p').textContent.includes('No comments')) {
      listContainer.innerHTML = '';
    }

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    const el = createCommentCardHTML(comment, defaultAvatar);
    listContainer.insertBefore(el, listContainer.firstChild);
  }

  function createCommentCardHTML(c, defaultAvatar) {
    const commentCard = document.createElement('div');
    commentCard.className = 'comment-card';

    const avatar = c.user.profilePicture || defaultAvatar;

    commentCard.innerHTML = `
      <img class="comment-avatar" src="${avatar}" alt="${c.user.name}" onclick="window.location.href='profile.html?id=${c.user._id}'" style="cursor:pointer;">
      <div class="comment-content">
        <div class="comment-author-row">
          <div onclick="window.location.href='profile.html?id=${c.user._id}'" style="cursor:pointer;">
            <span class="comment-author-name">${c.user.name}</span>
            <span style="font-size:0.75rem; color:var(--text-secondary)">@${c.user.username}</span>
          </div>
          <span class="comment-timestamp">${window.formatTimeAgo(c.createdAt)}</span>
        </div>
        <p class="comment-body">${c.content}</p>
      </div>
    `;

    return commentCard;
  }

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
            const currentUserObj = api.getCurrentUser();
            if (!currentUserObj.following) currentUserObj.following = [];
            currentUserObj.following.push(item._id);
            localStorage.setItem(window.ConnectHubConfig.USER_DATA_KEY, JSON.stringify(currentUserObj));

            loadThread(); // Reload thread state if it alters counts
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
