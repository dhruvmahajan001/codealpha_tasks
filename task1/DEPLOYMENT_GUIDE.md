# Deployment and Setup Guide

This guide details how to set up the MongoDB Atlas database, deploy the Express backend to **Render**, and host the Vanilla HTML/CSS/JS frontend on **Netlify**.

---

## 1. MongoDB Atlas Setup Guide

To create a cloud database for your application:

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2.  **Create a New Cluster**:
    *   Click **Create** or **New Cluster**.
    *   Select the **M0 Shared Free Tier**.
    *   Choose a cloud provider (e.g., AWS) and region nearest to you.
    *   Click **Create Deployment**.
3.  **Configure Database Security (Database User)**:
    *   Set up a username and a strong password. Save these credentials.
    *   Click **Create Database User**.
4.  **Configure Network Security (IP Access List)**:
    *   Under Network Access, choose **Add IP Address**.
    *   Select **Allow Access from Anywhere** (`0.0.0.0/0`) since cloud deployment platforms like Render will need to connect.
    *   Click **Confirm**.
5.  **Get the Connection URI**:
    *   Navigate to your Database Database page and click **Connect**.
    *   Select **Drivers** (Node.js).
    *   Copy the connection string (URI). It will look like:
        `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
    *   Replace `<username>` and `<password>` in the connection string with your database user credentials.

---

## 2. Render Deployment Guide (Backend)

Render is used to host your Node.js/Express API.

1.  **Prepare Repository**: Ensure your project is pushed to a GitHub repository.
2.  **Create Render Web Service**:
    *   Sign in to [Render](https://render.com/).
    *   Click **New** -> **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure Web Service**:
    *   **Name**: `shopnest-api` (or preferred name).
    *   **Root Directory**: `backend` (Important: points to the backend folder containing package.json).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `npm start` (or `node server.js`).
    *   **Instance Type**: `Free`.
4.  **Set Environment Variables**:
    *   Click on the **Advanced** tab or go to **Environment** in the service dashboard.
    *   Add the following variables:
        *   `PORT` = `10000` (or leave default, Render sets it automatically)
        *   `NODE_ENV` = `production`
        *   `MONGODB_URI` = `your_mongodb_atlas_connection_string`
        *   `JWT_SECRET` = `your_super_secret_jwt_key_12345`
        *   `CLIENT_URL` = `your_netlify_deployed_frontend_url` (You can update this after deploying the frontend)
5.  **Deploy**: Click **Create Web Service**. Render will build and deploy your API. Once running, copy your service's URL (e.g. `https://shopnest-api.onrender.com`).

---

## 3. Netlify Deployment Guide (Frontend)

Netlify is used to deploy your static HTML/CSS/JS files.

1.  **Configure the API Endpoint**:
    *   Open `frontend/js/config.js`.
    *   Ensure the `Production` URL in the ternary block points to your Render backend URL:
        ```javascript
        API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? "http://localhost:5000/api"
          : "https://shopnest-api.onrender.com/api" // Replace with your Render URL
        ```
    *   Save and commit the changes to GitHub.
2.  **Deploy via Netlify Dashboard**:
    *   Log in to [Netlify](https://www.netlify.com/).
    *   Click **Add new site** -> **Import from an existing project**.
    *   Select **GitHub** and connect your repository.
    *   Choose your branch (e.g., `main`).
    *   **Configure Build Settings**:
        *   **Base directory**: `frontend` (Important: hosts only static frontend assets).
        *   **Build command**: Leave blank (no build framework needed).
        *   **Publish directory**: `.` (Relative to base, meaning the `frontend` folder itself).
    *   Click **Deploy Site**.
3.  **Configure Redirects (Optional but recommended)**:
    *   Since our app relies on standard navigation, Netlify will serve individual HTML pages smoothly (e.g., `index.html`, `product.html`, etc.).
4.  **Update CLIENT_URL on Render**:
    *   Copy your Netlify site URL (e.g., `https://your-shopnest.netlify.app`).
    *   Go back to your Render dashboard, edit the `CLIENT_URL` environment variable to match this Netlify URL, and re-deploy the Render service. This secures your CORS configuration.

---

## 4. Run the Project Locally

### Step 1: Run the Backend
1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
3.  Fill in the `.env` parameters with your MongoDB connection string and a secret key.
4.  Install dependencies:
    ```bash
    npm install
    ```
5.  Seed the sample database:
    ```bash
    npm run seed
    ```
6.  Start the dev server:
    ```bash
    npm run dev
    ```

### Step 2: Run the Frontend
1.  Since the frontend consists of static files, you can launch a local live server.
2.  Open `frontend/index.html` using a server extension (e.g., VS Code Live Server running on port `5500`) or run a simple local server:
    ```bash
    npx serve frontend -p 5500
    ```
3.  Open browser to `http://localhost:5500`.
