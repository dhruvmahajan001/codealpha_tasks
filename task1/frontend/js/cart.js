/**
 * Shopping Cart Management
 * Handles guest carts via localStorage and database carts for logged-in users.
 */
const Cart = {
  // Get all cart items
  async getItems() {
    if (Auth.isAuthenticated()) {
      try {
        const response = await API.get('/cart');
        if (response.success && response.data) {
          // Return items in same structure
          return response.data.items || [];
        }
      } catch (error) {
        console.error('Failed to load database cart:', error);
      }
    }
    // Guest or fallback
    return this.getGuestCart();
  },

  // Get local guest cart
  getGuestCart() {
    const cartStr = localStorage.getItem('guest_cart');
    try {
      return cartStr ? JSON.parse(cartStr) : [];
    } catch (e) {
      return [];
    }
  },

  // Save local guest cart
  saveGuestCart(cart) {
    localStorage.setItem('guest_cart', JSON.stringify(cart));
    this.updateBadge();
  },

  // Add item to cart
  async addItem(product, quantity = 1) {
    const qty = Number(quantity);
    if (Auth.isAuthenticated()) {
      try {
        const response = await API.post('/cart/add', { productId: product._id, quantity: qty });
        if (response.success) {
          showToast(`${product.name} added to cart`, 'success');
          this.updateBadge();
          return response.data;
        }
      } catch (error) {
        showToast(error.message || 'Failed to add item to cart', 'error');
        throw error;
      }
    } else {
      // Guest logic
      const cart = this.getGuestCart();
      const existingIndex = cart.findIndex(item => item.product._id === product._id);

      if (existingIndex > -1) {
        cart[existingIndex].quantity += qty;
      } else {
        // Store full product details to easily render cart page offline
        cart.push({ product, quantity: qty });
      }

      this.saveGuestCart(cart);
      showToast(`${product.name} added to cart`, 'success');
    }
  },

  // Update cart item quantity
  async updateQuantity(productId, quantity) {
    const qty = Number(quantity);
    if (qty < 1) return;

    if (Auth.isAuthenticated()) {
      try {
        const response = await API.put('/cart/update', { productId, quantity: qty });
        if (response.success) {
          this.updateBadge();
          return response.data;
        }
      } catch (error) {
        showToast('Failed to update quantity', 'error');
        throw error;
      }
    } else {
      // Guest logic
      const cart = this.getGuestCart();
      const itemIndex = cart.findIndex(item => item.product._id === productId);
      if (itemIndex > -1) {
        cart[itemIndex].quantity = qty;
        this.saveGuestCart(cart);
      }
    }
  },

  // Remove item from cart
  async removeItem(productId) {
    if (Auth.isAuthenticated()) {
      try {
        const response = await API.delete(`/cart/remove/${productId}`);
        if (response.success) {
          showToast('Item removed from cart', 'success');
          this.updateBadge();
          return response.data;
        }
      } catch (error) {
        showToast('Failed to remove item', 'error');
        throw error;
      }
    } else {
      // Guest logic
      let cart = this.getGuestCart();
      cart = cart.filter(item => item.product._id !== productId);
      this.saveGuestCart(cart);
      showToast('Item removed from cart', 'success');
    }
  },

  // Sync Guest Cart to DB after Login
  async syncLocalCartToDB() {
    const guestCart = this.getGuestCart();
    if (guestCart.length === 0) return;

    try {
      console.log('Syncing guest cart to database...');
      for (const item of guestCart) {
        await API.post('/cart/add', {
          productId: item.product._id,
          quantity: item.quantity
        });
      }
      // Clear guest cart
      localStorage.removeItem('guest_cart');
      console.log('Cart synced successfully!');
    } catch (error) {
      console.error('Failed to sync local cart to DB:', error);
    }
  },

  // Get total price
  async calculateTotal() {
    const items = await this.getItems();
    return items.reduce((total, item) => {
      const price = item.product ? item.product.price : 0;
      return total + price * item.quantity;
    }, 0);
  },

  // Update navbar cart badge count
  async updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    try {
      const items = await this.getItems();
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('pulse');
        setTimeout(() => badge.classList.remove('pulse'), 500);
      } else {
        badge.classList.add('hidden');
      }
    } catch (e) {
      console.error('Error updating badge:', e);
    }
  }
};

// Initial badge update on load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
});
