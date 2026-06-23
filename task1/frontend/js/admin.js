/**
 * Admin Panel Product Management Controller
 */
const Admin = {
  // Check admin status on launch
  init() {
    if (!Auth.isAuthenticated() || !Auth.isAdmin()) {
      showToast('Access denied: Administrators only.', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      return;
    }

    this.loadProductsList();
    this.setupEventListeners();
  },

  // Setup UI Listeners
  setupEventListeners() {
    const addProductForm = document.getElementById('admin-product-form');
    const addBtn = document.getElementById('admin-add-product-btn');
    const modal = document.getElementById('product-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');

    if (!addProductForm || !addBtn || !modal) return;

    // Show Add Modal
    addBtn.addEventListener('click', () => {
      addProductForm.reset();
      document.getElementById('edit-product-id').value = '';
      modalTitle.textContent = 'Add New Product';
      modal.classList.add('show');
    });

    // Close Modal
    const hideModal = () => modal.classList.remove('show');
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    
    // Close on click outside modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });

    // Handle Form Submit (Add or Edit)
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const productId = document.getElementById('edit-product-id').value;
      const name = document.getElementById('product-name').value.trim();
      const description = document.getElementById('product-desc').value.trim();
      const category = document.getElementById('product-category').value;
      const image = document.getElementById('product-image').value.trim();
      const price = Number(document.getElementById('product-price').value);
      const stock = Number(document.getElementById('product-stock').value);

      if (!name || !description || !category || !image || isNaN(price) || isNaN(stock)) {
        showToast('Please fill all fields correctly', 'error');
        return;
      }

      const body = { name, description, category, image, price, stock };
      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner-btn"></span> Saving...';

      try {
        let response;
        if (productId) {
          // Edit existing product
          response = await API.put(`/products/${productId}`, body);
          if (response.success) {
            showToast('Product updated successfully!', 'success');
          }
        } else {
          // Add new product
          response = await API.post('/products', body);
          if (response.success) {
            showToast('Product added successfully!', 'success');
          }
        }

        if (response.success) {
          hideModal();
          this.loadProductsList();
        }
      } catch (err) {
        showToast(err.message || 'Operation failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = productId ? 'Update Product' : 'Add Product';
      }
    });
  },

  // Fetch and Render Product Management Table
  async loadProductsList() {
    const tableBody = document.getElementById('admin-products-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">
          <span class="loading-spinner"></span> Loading product catalog...
        </td>
      </tr>
    `;

    try {
      const response = await API.get('/products');
      if (response.success) {
        const products = response.data;
        if (products.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center py-4">No products in database. Click Add Product to seed the database!</td>
            </tr>
          `;
          return;
        }

        tableBody.innerHTML = products.map(product => `
          <tr>
            <td>
              <img src="${product.image}" alt="${product.name}" class="admin-table-thumb">
            </td>
            <td class="font-semibold">${product.name}</td>
            <td><span class="category-pill">${product.category}</span></td>
            <td class="font-semibold">$${product.price.toFixed(2)}</td>
            <td>
              <span class="stock-status-pill ${product.stock > 0 ? 'status-instock' : 'status-outofstock'}">
                ${product.stock} units
              </span>
            </td>
            <td>${new Date(product.createdAt).toLocaleDateString()}</td>
            <td>
              <div class="admin-actions-cell">
                <button class="btn btn-outline btn-sm edit-btn" data-id="${product._id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${product._id}">Delete</button>
              </div>
            </td>
          </tr>
        `).join('');

        // Wire edit & delete buttons
        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const prod = products.find(p => p._id === id);
            if (prod) this.openEditModal(prod);
          });
        });

        tableBody.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const prod = products.find(p => p._id === id);
            if (prod) this.handleDelete(prod);
          });
        });
      }
    } catch (error) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger py-4">
            Failed to load products: ${error.message}
          </td>
        </tr>
      `;
    }
  },

  // Open edit modal and pre-fill details
  openEditModal(product) {
    const modal = document.getElementById('product-modal');
    const addProductForm = document.getElementById('admin-product-form');
    const modalTitle = document.getElementById('modal-title');

    if (!modal || !addProductForm || !modalTitle) return;

    modalTitle.textContent = 'Edit Product';
    document.getElementById('edit-product-id').value = product._id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-desc').value = product.description;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-image').value = product.image;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;

    modal.classList.add('show');
  },

  // Handle delete action
  async handleDelete(product) {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        const response = await API.delete(`/products/${product._id}`);
        if (response.success) {
          showToast('Product successfully deleted', 'success');
          this.loadProductsList();
        }
      } catch (err) {
        showToast(err.message || 'Delete operation failed', 'error');
      }
    }
  }
};
