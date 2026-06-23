const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const products = [
  // Electronics
  {
    name: 'Aura Sound Wireless Headphones',
    description: 'Immersive sound experience with active noise cancellation, 40-hour battery life, and comfortable memory foam ear cups.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60',
    price: 129.99,
    stock: 15,
  },
  {
    name: 'PulseFit Smartwatch Series X',
    description: 'Track your daily activity, heart rate, blood oxygen, sleep patterns, and receive real-time smartphone notifications.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=60',
    price: 199.99,
    stock: 8,
  },
  {
    name: 'SonicBounce Mini Bluetooth Speaker',
    description: 'Compact yet powerful waterproof speaker with 360-degree room-filling audio and a built-in hanging loop.',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=60',
    price: 49.99,
    stock: 25,
  },
  // Clothing
  {
    name: 'Vintage Blue Denim Jacket',
    description: 'Timeless denim jacket crafted from 100% premium rigid cotton. Features standard button closures and double button-flap chest pockets.',
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=60',
    price: 69.99,
    stock: 12,
  },
  {
    name: 'Cosy Cable-Knit Sweater',
    description: 'Ultra-soft relaxed-fit knitted sweater perfect for layering during chilly days. Knit from breathable cotton-blend yarns.',
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=60',
    price: 59.99,
    stock: 14,
  },
  {
    name: 'Standard Linen Summer Shirt',
    description: 'Lightweight and highly breathable long-sleeve shirt. Pre-washed for maximum softness and a relaxed fit.',
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=60',
    price: 39.99,
    stock: 20,
  },
  // Shoes
  {
    name: 'Stratus Classic Red Sneakers',
    description: 'Iconic running shoes engineered with advanced comfort midsoles, breathable mesh, and high-traction rubber outsoles.',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60',
    price: 89.99,
    stock: 10,
  },
  {
    name: 'Heritage Waterproof Leather Boots',
    description: 'Handcrafted premium leather boots with waterproof sealed seams, durable lugged soles, and cushioned OrthoLite insoles.',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=60',
    price: 149.99,
    stock: 6,
  },
  {
    name: 'Urban Sleek Suede Loafers',
    description: 'Sophisticated slip-on suede loafers. Finished with comfortable leather linings and flexible low-profile outsoles.',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=60',
    price: 79.99,
    stock: 18,
  },
  // Accessories
  {
    name: 'Tan Grain Leather Wallet',
    description: 'Minimalist bi-fold wallet featuring six card slots, a spacious bill compartment, and RFID blocking protection.',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627124118303-624c8b55097e?w=600&auto=format&fit=crop&q=60',
    price: 29.99,
    stock: 30,
  },
  {
    name: 'Voyager Heavy Duty Backpack',
    description: 'Durable water-resistant canvas backpack equipped with a padded 15.6" laptop sleeve and multiple utility pockets.',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=60',
    price: 54.99,
    stock: 15,
  },
  {
    name: 'Solstice Polarized Sunglasses',
    description: 'Classic round-frame sunglasses with 100% UV protection and glare-reducing polarized lenses. Includes a carrying case.',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=60',
    price: 34.99,
    stock: 22,
  },
];

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected for seeding...');

    // Clear existing products
    await Product.deleteMany();
    console.log('Cleared existing products.');

    // Seed new products
    await Product.insertMany(products);
    console.log('Seeded 12 e-commerce products successfully.');

    // Check/Create Default Admin
    const adminExists = await User.findOne({ email: 'admin@shopnest.com' });
    if (!adminExists) {
      await User.create({
        name: 'ShopNest Admin',
        email: 'admin@shopnest.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Created default admin: admin@shopnest.com / admin123');
    } else {
      console.log('Admin user already exists.');
    }

    // Check/Create Default User for easy login
    const userExists = await User.findOne({ email: 'john@gmail.com' });
    if (!userExists) {
      await User.create({
        name: 'John Doe',
        email: 'john@gmail.com',
        password: 'password123',
        role: 'user',
      });
      console.log('Created default user: john@gmail.com / password123');
    }

    console.log('Data Seeding Completed!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
