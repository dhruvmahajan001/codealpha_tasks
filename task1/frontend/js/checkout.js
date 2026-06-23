/**
 * Checkout Form Handling and Order Submission
 */
const Checkout = {
  // Initialize checkout page
  async init() {
    // 1. Guard route: checkout requires user login
    if (!Auth.isAuthenticated()) {
      showToast('Please login to complete your order', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html?redirect=checkout.html';
      }, 1000);
      return;
    }

    const orderSummaryContainer = document.getElementById('checkout-items-list');
    const orderTotalContainer = document.getElementById('checkout-grand-total');
    const checkoutForm = document.getElementById('checkout-form');
    const placeOrderBtn = document.getElementById('place-order-btn');

    if (!orderSummaryContainer || !checkoutForm) return;

    try {
      // 2. Fetch cart items
      const items = await Cart.getItems();
      if (items.length === 0) {
        showToast('Your cart is empty', 'warning');
        setTimeout(() => {
          window.location.href = 'cart.html';
        }, 1000);
        return;
      }

      // 3. Render Order Summary
      let itemsHTML = '';
      let totalAmount = 0;

      items.forEach(item => {
        const product = item.product;
        if (!product) return;

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        itemsHTML += `
          <div class="checkout-summary-item">
            <div class="checkout-item-details">
              <span class="checkout-item-name">${product.name}</span>
              <span class="checkout-item-qty">Qty: ${item.quantity}</span>
            </div>
            <span class="checkout-item-subtotal">$${subtotal.toFixed(2)}</span>
          </div>
        `;
      });

      orderSummaryContainer.innerHTML = itemsHTML;
      orderTotalContainer.textContent = `$${totalAmount.toFixed(2)}`;

      // 4. Form submit listener
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Retrieve field values
        const fullName = document.getElementById('fullName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const pincode = document.getElementById('pincode').value.trim();

        // Client-side validations
        if (!fullName || !phoneNumber || !address || !city || !state || !pincode) {
          showToast('Please fill in all shipping fields', 'error');
          return;
        }

        if (phoneNumber.length < 8) {
          showToast('Please enter a valid phone number', 'error');
          return;
        }

        if (pincode.length < 4) {
          showToast('Please enter a valid pincode', 'error');
          return;
        }

        // Show placing state
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<span class="loading-spinner-btn"></span> Placing Order...';

        try {
          const orderBody = {
            shippingAddress: {
              fullName,
              phoneNumber,
              address,
              city,
              state,
              pincode
            }
          };

          const response = await API.post('/orders', orderBody);

          if (response.success && response.data) {
            // Save order data for success page display
            sessionStorage.setItem('last_order', JSON.stringify(response.data));
            // Update cart badge
            Cart.updateBadge();
            
            showToast('Order placed successfully!', 'success');
            setTimeout(() => {
              window.location.href = 'success.html';
            }, 1000);
          } else {
            throw new Error(response.message || 'Order creation failed');
          }
        } catch (error) {
          showToast(error.message || 'Failed to place order. Try again.', 'error');
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Place Order';
        }
      });

    } catch (error) {
      console.error(error);
      showToast('Error loading checkout page', 'error');
    }
  },

  // Initialize Order Success Page
  initSuccessPage() {
    const successDetails = document.getElementById('success-details');
    if (!successDetails) return;

    const orderDataStr = sessionStorage.getItem('last_order');
    if (!orderDataStr) {
      window.location.href = 'index.html';
      return;
    }

    try {
      const order = JSON.parse(orderDataStr);
      const date = new Date(order.createdAt).toLocaleString();

      let productsListHTML = order.products.map(item => `
        <li class="receipt-product-item">
          <span>${item.name} (x${item.quantity})</span>
          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
        </li>
      `).join('');

      successDetails.innerHTML = `
        <div class="receipt-card">
          <div class="receipt-header">
            <div class="success-checkmark">✓</div>
            <h2>Thank You For Your Purchase!</h2>
            <p>Your order has been placed successfully.</p>
          </div>
          <div class="receipt-body">
            <div class="receipt-row">
              <span>Order ID:</span>
              <strong class="order-id-value">${order._id}</strong>
            </div>
            <div class="receipt-row">
              <span>Date:</span>
              <span>${date}</span>
            </div>
            <div class="receipt-row">
              <span>Status:</span>
              <span class="status-badge status-pending">${order.orderStatus}</span>
            </div>
            <hr class="receipt-divider">
            <h3>Items Purchased:</h3>
            <ul class="receipt-products-list">
              ${productsListHTML}
            </ul>
            <hr class="receipt-divider">
            <div class="receipt-row receipt-total-row">
              <span>Total Amount Paid:</span>
              <strong>$${order.totalAmount.toFixed(2)}</strong>
            </div>
            <hr class="receipt-divider">
            <h3>Shipping To:</h3>
            <p class="receipt-address">
              <strong>${order.shippingAddress.fullName}</strong><br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.shippingAddress.phoneNumber}
            </p>
          </div>
        </div>
      `;

      // Clear session storage so reloads don't stick on success screen
      sessionStorage.removeItem('last_order');

    } catch (e) {
      console.error(e);
      window.location.href = 'index.html';
    }
  }
};
