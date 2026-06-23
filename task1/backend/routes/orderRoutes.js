const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All order endpoints require authentication
router.use(protect);

router.route('/')
  .post(createOrder);

router.route('/user')
  .get(getUserOrders);

module.exports = router;
