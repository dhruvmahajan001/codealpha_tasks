const CONFIG = {
  // Automatically switches between local Express server and deployed Render server
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://localhost:5000/api"
    : "https://your-render-backend.onrender.com/api" // Replace with your actual Render backend URL during deployment
};
