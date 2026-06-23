const express = require('express');
const router = express.Router();
const {
  getUserCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// All cart endpoints require user authentication
router.use(protect);

router.route('/')
  .get(getUserCart);

router.route('/add')
  .post(addToCart);

router.route('/update')
  .put(updateCartItem);

router.route('/remove/:productId')
  .delete(removeCartItem);

module.exports = router;
