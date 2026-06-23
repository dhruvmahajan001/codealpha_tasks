# ConnectHub Deployment Guide

This guide provides step-by-step instructions to deploy the **ConnectHub** Social Media Web Application. We will set up a MongoDB Atlas database cloud cluster, deploy the Node.js/Express backend on **Render**, and host the static HTML/CSS/JS frontend on **Netlify**.

---

## Part 1: MongoDB Atlas Database Setup

Before deploying the backend, you need a cloud-hosted MongoDB database.

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2.  **Create a Cluster**:
    *   Click **Create** to build a new database cluster.
    *   Select the **M0 Free Tier** (Shared RAM/CPU).
    *   Choose a provider (e.g., AWS) and region nearest to your target audience.
    *   Click **Create Cluster**.
3.  **Configure Database Security**:
    *   **Database User**: Set up a username and a strong password. *Write these down; you will need them for the connection string.*
    *   **Network Access (IP Whitelist)**:
        *   Navigate to **Network Access** in the left sidebar.
        *   Click **Add IP Address**.
        *   Select **Allow Access from Anywhere** (IP `0.0.0.0/0`). This is crucial because Render's build servers and web hosts dynamically change IP addresses.
4.  **Copy the Connection String**:
    *   Go to **Database** (formerly Clusters) in the left sidebar.
    *   Click **Connect** on your cluster.
    *   Select **Drivers** (under *Connect to your application*).
    *   Copy the connection string (it looks like `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`).
    *   Replace `<username>` and `<password>` with the database credentials you created in step 3.

---

## Part 2: Backend Deployment on Render

Render will host the live Express API.

1.  **Push Code to GitHub**:
    *   Make sure your `task2` project is pushed to a repository on GitHub.
2.  **Create a Web Service on Render**:
    *   Go to the [Render Dashboard](https://dashboard.render.com) and log in.
    *   Click **New +** (top right) and select **Web Service**.
    *   Connect your GitHub account and select your project's repository.
3.  **Configure Settings**:
    *   **Name**: `connecthub-api` (or any custom name).
    *   **Region**: Select a region close to your database cluster.
    *   **Branch**: `main` (or whichever branch holds your code).
    *   **Root Directory**: `backend` (This tells Render to run command commands inside the backend sub-folder).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `npm start` (or `node server.js`).
    *   **Instance Type**: `Free`.
4.  **Add Environment Variables**:
    *   Click the **Advanced** button or find the **Environment Variables** section.
    *   Add the following keys and values:
        *   `MONGODB_URI`: *Your MongoDB connection string copied in Part 1.*
        *   `JWT_SECRET`: *A random, secure string (e.g. `connecthub_secret_key_987654321`).*
        *   `NODE_ENV`: `production`
5.  **Deploy**:
    *   Click **Create Web Service**.
    *   Once the deployment is complete, Render will display a live URL (e.g., `https://connecthub-api.onrender.com`). Copy this URL.

---

## Part 3: Frontend Deployment on Netlify

Netlify will host the static HTML, CSS, and Javascript files.

1.  **Update API Endpoint**:
    *   Open `frontend/js/config.js` in your codebase.
    *   Update the production key value with the Render live URL you copied in Part 2:
        ```javascript
        API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000/api'
          : 'https://connecthub-api.onrender.com/api', // <-- Paste your Render URL here (append /api)
        ```
    *   Commit and push this change to your GitHub repository.
2.  **Import Site into Netlify**:
    *   Log in to the [Netlify Dashboard](https://app.netlify.com).
    *   Click **Add new site** -> **Import an existing project**.
    *   Select **GitHub** and authorize Netlify.
    *   Select your project's repository.
3.  **Configure Deploy Settings**:
    *   **Branch to deploy**: `main`.
    *   **Base directory**: `frontend` (This isolates Netlify to work only with files inside the frontend folder).
    *   **Build command**: *Leave this empty* (Netlify does not need to build vanilla HTML/CSS).
    *   **Publish directory**: `.` (This refers to the root of the base directory, which is the `frontend` folder).
4.  **Deploy**:
    *   Click **Deploy Site**.
    *   Netlify will deploy your pages and supply a URL (e.g., `https://connecthub-app.netlify.app`).

---

## Verification & Troubleshooting

1.  **Check API Endpoint**: Visit `https://your-backend-app.onrender.com/` in your browser. It should respond with:
    ```json
    {
      "success": true,
      "message": "ConnectHub API is running smoothly...",
      "version": "1.0.0"
    }
    ```
2.  **CORS Issues**: If you experience errors like `CORS header 'Access-Control-Allow-Origin' missing`, ensure that the backend's `server.js` includes:
    ```javascript
    const cors = require('cors');
    app.use(cors());
    ```
    This is already included in our codebase to prevent cross-origin blocks during evaluations.
3.  **Cold Starts**: Render's free tier spins down services after 15 minutes of inactivity. When loading the Netlify app for the first time in a while, it may take 30–50 seconds for the backend to wake up. Once awake, performance will be fast and responsive.
