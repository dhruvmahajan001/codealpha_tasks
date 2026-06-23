# ShopNest - Modern E-Commerce Web Application

**ShopNest** is a complete, production-ready, internship-level E-Commerce web application built to fulfill the **CodeAlpha Internship Task 1** requirements. It showcases a modern, responsive frontend powered by Vanilla Javascript and a robust RESTful API backend engineered with Node.js, Express.js, and MongoDB Atlas.

---

## 🚀 Key Features

*   **Responsive Product Catalog**: Filter products by categories, search items via a real-time search input, and sort listings by price.
*   **Detailed Product Pages**: Displays descriptions, pricing, real-time stock levels, and a numeric quantity selector.
*   **Persistent Shopping Cart**: Support for local storage (guest cart) and automatic synchronization with MongoDB database carts upon user login.
*   **User Authentication**: Secure signup and signin using JSON Web Tokens (JWT) and bcrypt password hashing.
*   **Order Processing**: Dynamic checkout validation (name, phone, address fields) with stock validation and inventory deduction.
*   **Order Confirmation**: Custom receipt displaying order ID, transaction summary, items purchased, totals, and timestamps.
*   **Admin Dashboard (Bonus)**: Fully protected dashboard interface where administrators can view inventory, add new products, edit descriptions, adjust prices, and delete items from the database.

---

## 🛠️ Technology Stack

*   **Frontend**: HTML5, CSS3 (Custom design system, glassmorphism, responsive grids, variables), Vanilla JavaScript.
*   **Backend**: Node.js, Express.js (MVC Pattern).
*   **Database**: MongoDB Atlas, Mongoose (Schemas for Users, Products, Carts, and Orders).
*   **Security & Auth**: JWT (jsonwebtoken), bcryptjs, CORS, Route Guard Middlewares.
*   **Deployment**: Frontend on Netlify, Backend on Render.

---

## 🎨 UI/UX Design Palette

The design utilizes a modern, mobile-first aesthetic with smooth micro-interactions, responsive flex-grids, skeleton loader states, and pop-up toast alerts:

*   **Primary**: `#2563eb` (Royal Blue)
*   **Secondary**: `#1e40af` (Navy)
*   **Accent**: `#f59e0b` (Amber Gold)
*   **Background**: `#f8fafc` (Off-white Slate)
*   **Text**: `#0f172a` (Slate Black)

---

## 📁 Repository Structure

```
task1/
├── DEPLOYMENT_GUIDE.md      # Step-by-step Atlas, Render, and Netlify guide
├── README.md                # General project overview
├── .gitignore               # Excludes secrets and node_modules
│
├── backend/                 # Backend Node/Express API
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose connector
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   └── authMiddleware.js # Token & role verify middlewares
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   ├── utils/
│   │   └── seed.js          # Seeds 12 mock products & default users
│   ├── package.json
│   ├── server.js            # Express app bootstrap
│   └── .env.example         # Template for database & JWT keys
│
└── frontend/                # Frontend Static Client
    ├── index.html           # Catalog dashboard
    ├── product.html         # Item details
    ├── cart.html            # Shopping cart overview
    ├── login.html           # User session sign-in
    ├── register.html        # Account creation
    ├── checkout.html        # Shipping and validation
    ├── success.html         # Custom confirmation invoice
    ├── admin.html           # Administrator inventory board
    ├── css/
    │   └── style.css        # Premium stylesheets
    └── js/
        ├── config.js        # Environment API router config
        ├── api.js           # Generic API fetch wrapper with JWT attach
        ├── auth.js          # Authentication handlers
        ├── products.js      # Catalog rendering utilities
        ├── cart.js          # Cart storage and synchronization
        ├── checkout.js      # Shipping forms and checkout processor
        └── admin.js         # Admin table manager
```

---

## 🔒 Security & Route Guards

1.  **Password Hashing**: Passwords are secure-hashed using `bcryptjs` with 10 salt rounds before database persistence.
2.  **JWT Authentication**: API endpoints for Cart and Orders require a valid JSON Web Token inside the `Authorization` header (`Bearer <token>`).
3.  **Role Protection**: Admin routes (`POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`) verify if the logged-in user's role is set to `admin`.
4.  **CORS & Input Sanitization**: Configured cross-origin resource sharing, email validations, password matching, and stock count limits.

---

## 🔌 REST API Endpoints

### Auth (`/api/auth`)
*   `POST /api/auth/register` - Registers a new user account.
*   `POST /api/auth/login` - Authenticates user and issues a JWT token.

### Products (`/api/products`)
*   `GET /api/products` - Returns product lists. Supports parameters: `search`, `category`, `sort`.
*   `GET /api/products/:id` - Fetch details for a specific product.
*   `POST /api/products` - Create new product (Admin Only).
*   `PUT /api/products/:id` - Update existing product (Admin Only).
*   `DELETE /api/products/:id` - Delete product (Admin Only).

### Cart (`/api/cart`)
*   `GET /api/cart` - Returns current user's cart (Populated).
*   `POST /api/cart/add` - Add item to cart.
*   `PUT /api/cart/update` - Modify cart item quantity.
*   `DELETE /api/cart/remove/:productId` - Delete item from cart.

### Orders (`/api/orders`)
*   `POST /api/orders` - Place a new order (clears cart, decreases inventory).
*   `GET /api/orders/user` - Fetch order history for the logged-in user.

---

## 🔑 Seeding and Testing Credentials

To make testing the application extremely easy, the database seeding script automatically sets up sample products and creates two demo accounts:

### 👤 Demo Standard User Account
*   **Email**: `john@gmail.com`
*   **Password**: `password123`
*   **Role**: User (Standard cart checkout operations)

### 🔑 Demo Administrator Account
*   **Email**: `admin@shopnest.com`
*   **Password**: `admin123`
*   **Role**: Admin (Grants access to the **Admin Panel** link in the navigation bar for product CRUD)

---

## 🛠️ Quick Start

Please check [DEPLOYMENT_GUIDE.md](file:///c:/Users/dhruv/OneDrive/Desktop/codealpha/task1/DEPLOYMENT_GUIDE.md) for database connection keys, env configurations, local launch commands, and step-by-step details for Render & Netlify deployment!
