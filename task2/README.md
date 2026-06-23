# ConnectHub — Modern Mini Social Media Platform

ConnectHub is a modern, responsive, internship-level social media platform built for **CodeAlpha Task 2**. It features user account creation, secure login, a live home feed with trending hashtag tracking, user search, post creation (supporting both direct image URLs and local base64 photo uploads), like/unlike toggles, thread-based comments, and an interactive follow/unfollow system.

The application incorporates a sleek, glassmorphic layout and comes with full **Dark Mode** theme configuration out of the box.

---

## Technical Stack

*   **Frontend**: HTML5, CSS3 (Vanilla design tokens, CSS variables, glassmorphic card patterns), Vanilla ES6 JavaScript
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB Atlas, Mongoose ODM
*   **Authentication**: JSON Web Tokens (JWT) & `bcryptjs` password hashing

---

## Directory Structure

```
task2
├── frontend
│   ├── index.html            # Main dashboard / feed view
│   ├── login.html            # Security login panel
│   ├── register.html         # User account registration panel
│   ├── profile.html          # Dynamic profile views & editing
│   ├── post.html             # Thread details, comment inputs
│   ├── css
│   │   └── style.css         # Responsive styling & dark theme
│   └── js
│       ├── config.js         # API URL environmental switches
│       ├── api.js            # Centralized API fetch engine
│       ├── auth.js           # Route guards, dark mode, user snippets
│       ├── feed.js           # Feed rendering, hashtags, likes, creators
│       ├── profile.js        # Profile detail manager, uploads
│       └── post.js           # Thread load controllers, comment submission
├── backend
│   ├── config
│   │   └── db.js             # Mongoose connection bootstrapper
│   ├── controllers
│   │   ├── authController.js # Handles registration & log ins
│   │   ├── userController.js # Profiles editing, follows & suggestions
│   │   └── postController.js # Post CRUD, likes, comments, hashtag trend logs
│   ├── middleware
│   │   ├── authMiddleware.js # JWT token validation routing guard
│   │   └── errorMiddleware.js# Custom Express JSON error responder
│   ├── models
│   │   ├── User.js           # MongoDB User Schema definition
│   │   ├── Post.js           # MongoDB Post Schema definition
│   │   └── Comment.js        # MongoDB Comment Schema definition
│   ├── routes
│   │   ├── authRoutes.js     # Express auth routes mapping
│   │   ├── userRoutes.js     # Express profile/follow routes mapping
│   │   └── postRoutes.js     # Express post/like/comment routes mapping
│   ├── package.json          # Node dependencies configuration
│   ├── server.js             # Application bootstrapper file
│   ├── .env.example          # Environment variables template
│   └── .gitignore            # Version control ignore lists
└── README.md                 # Complete project documentation
```

---

## Local Development Startup Guide

### Prerequisites
*   Node.js installed (v18.0.0 or higher recommended)
*   A MongoDB Atlas connection URI or local MongoDB instance

### 1. Backend Server Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the template:
   ```bash
   copy .env.example .env
   ```
4. Edit the `.env` file and replace the placeholders:
   *   `MONGODB_URI`: Insert your MongoDB Atlas connection string.
   *   `JWT_SECRET`: Insert a private key string (e.g. `my_super_secret_connecthub_key_123`).
   *   `PORT`: Keep it at `5000` (or match whatever port you want).
5. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *(The terminal should output `MongoDB Connected: ...` and `Server running on port 5000`)*

### 2. Frontend Client Setup
1. The frontend uses static Vanilla JS and HTML. You can launch it using any web host or local static server.
2. In VS Code, you can click **Go Live** using the *Live Server* extension on the `frontend/index.html` file.
3. Keep the default local server url at `http://127.0.0.1:5500` or `http://localhost:5500`. Ensure that the backend CORS rules allow cross-origin requests.

---

## Deployment Guide: Render (Backend)

Render is an excellent platform for deploying Node.js/Express web services.

1.  **Push Code to GitHub**: Create a repository on GitHub and push your ConnectHub project code to it.
2.  **Create a New Web Service**:
    *   Sign in to your [Render Dashboard](https://dashboard.render.com).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure Web Service Parameters**:
    *   **Name**: `connecthub-backend` (or a name of your choice).
    *   **Root Directory**: `backend` (Ensure Render is looking inside the `backend` folder).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `npm start` (which executes `node server.js`).
4.  **Configure Environment Variables**:
    *   Scroll down to the **Environment Variables** section (or click the **Env Groups** tab).
    *   Add the following variables:
        *   `MONGODB_URI`: `your_mongodb_connection_string`
        *   `JWT_SECRET`: `your_random_secure_jwt_token_secret`
        *   `NODE_ENV`: `production`
5.  **Deploy**: Click **Deploy Web Service**. Once the build succeeds, copy the provided Web Service URL (e.g., `https://connecthub-backend.onrender.com`).

---

## Deployment Guide: Netlify (Frontend)

Netlify is the ideal hosting solution for static web pages.

1.  **Configure API URL for Production**:
    *   Open `frontend/js/config.js` in your codebase.
    *   Replace the fallback URL under `API_URL` with your **live Render backend web service URL** copied from Render:
        ```javascript
        API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000/api'
          : 'https://YOUR-RENDER-APP-NAME.onrender.com/api',
        ```
    *   Commit and push this change to GitHub.
2.  **Deploy via Netlify Dashboard**:
    *   Log in to your [Netlify Dashboard](https://app.netlify.com).
    *   Click **Add new site** -> **Import an existing project**.
    *   Connect to your Git provider (GitHub) and select your project repository.
3.  **Build & Deploy Settings**:
    *   **Base directory**: `frontend` (Ensure Netlify deploys only files inside the `frontend` folder).
    *   **Build command**: *(Leave blank)*.
    *   **Publish directory**: `.` (Since base directory is already set to `frontend`, this points to the root of the frontend folder).
4.  **Deploy**: Click **Deploy Site**. Netlify will build and host your ConnectHub frontend, supplying a live link (e.g., `https://your-site-name.netlify.app`) to access the social media web app.

---

## Premium Features Added
*   **Theme Toggle**: Fully responsive Dark Mode using CSS styling variables.
*   **Dynamic suggested users**: Fetches recommended profiles excluding accounts you already follow.
*   **Dynamic trending hashtags**: Renders active tags compiled directly from current posts. Clicking a tag immediately filters the Home Feed.
*   **No-Cloud base64 file uploads**: Upload profile avatar changes and post images locally without external AWS/Cloudinary configuration requirements.
*   **Activity relative timestamps**: Renders modern dates (e.g. `5m ago`, `2h ago`).
