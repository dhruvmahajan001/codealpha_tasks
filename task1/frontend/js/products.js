/**
 * Product Catalog and Detail View Manager
 */
const Products = {
  // Store loaded products list
  list: [],
  currentProduct: null,

  // Fetch all products with query parameters
  async fetchAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await API.get(`/products${queryString}`);
    
    if (response.success) {
      this.list = response.data;
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch products');
  },

  // Fetch a single product details
  async fetchById(id) {
    const response = await API.get(`/products/${id}`);
    if (response.success) {
      this.currentProduct = response.data;
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch product details');
  },

  // Render product skeletons (loading placeholder)
  renderSkeletons(containerId, count = 8) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
      skeletonHTML += `
        <div class="product-card skeleton-card">
          <div class="skeleton skeleton-img"></div>
          <div class="product-info">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="product-price-row">
              <div class="skeleton skeleton-price"></div>
              <div class="skeleton skeleton-btn"></div>
            </div>
          </div>
        </div>
      `;
    }
    container.innerHTML = skeletonHTML;
  },

  // Render products grid
  renderGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="no-products">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="no-products-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <h3>No Products Found</h3>
          <p>Try adjusting your search filters or check back later.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => {
      const isOutOfStock = product.stock === 0;
      return `
        <div class="product-card">
          <div class="product-img-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            <span class="product-category-tag">${product.category}</span>
          </div>
          <div class="product-info">
            <h3 class="product-title" title="${product.name}">${product.name}</h3>
            <p class="product-desc-short">${product.description.substring(0, 75)}...</p>
            <div class="product-price-row">
              <div class="price-stock-col">
                <span class="product-price">$${product.price.toFixed(2)}</span>
                <span class="product-stock-lbl ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                  ${isOutOfStock ? 'Out of Stock' : `${product.stock} left`}
                </span>
              </div>
              <a href="product.html?id=${product._id}" class="btn btn-outline btn-sm">View Details</a>
            </div>
            <button 
              class="btn btn-primary btn-full-width add-to-cart-grid-btn" 
              data-id="${product._id}"
              ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Add to Cart event listeners to grid buttons
    container.querySelectorAll('.add-to-cart-grid-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const productId = btn.getAttribute('data-id');
        const prodObj = products.find(p => p._id === productId);
        if (prodObj) {
          btn.disabled = true;
          btn.innerHTML = '<span class="loading-spinner-btn"></span> Adding...';
          try {
            await Cart.addItem(prodObj, 1);
          } catch (err) {
            console.error(err);
          } finally {
            btn.disabled = prodObj.stock === 0;
            btn.textContent = prodObj.stock === 0 ? 'Sold Out' : 'Add to Cart';
          }
        }
      });
    });
  },

  // Setup homepage logic
  async initCatalogPage() {
    const gridId = 'products-grid';
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const sortSelect = document.getElementById('sort-select');

    let filters = {
      search: '',
      category: 'All',
      sort: 'newest'
    };

    const loadAndRender = async () => {
      this.renderSkeletons(gridId, 8);
      try {
        const products = await this.fetchAll(filters);
        this.renderGrid(products, gridId);
      } catch (err) {
        document.getElementById(gridId).innerHTML = `
          <div class="error-state">
            <h3>Unable to load products</h3>
            <p>${err.message}</p>
            <button onclick="window.location.reload()" class="btn btn-primary mt-2">Try Again</button>
          </div>
        `;
      }
    };

    // 1. Setup Search
    if (searchBtn && searchInput) {
      const handleSearch = () => {
        filters.search = searchInput.value.trim();
        loadAndRender();
      };
      searchBtn.addEventListener('click', handleSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
    }

    // 2. Setup Category Filters
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filters.category = btn.getAttribute('data-category');
        loadAndRender();
      });
    });

    // 3. Setup Sorting Selection
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        filters.sort = sortSelect.value;
        loadAndRender();
      });
    }

    // Initial Load
    await loadAndRender();
  },

  // Setup single product details page logic
  async initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
      window.location.href = 'index.html';
      return;
    }

    const detailContainer = document.getElementById('product-detail-container');
    if (!detailContainer) return;

    detailContainer.innerHTML = `
      <div class="loading-container-details">
        <span class="loading-spinner"></span>
        <p>Loading product details...</p>
      </div>
    `;

    try {
      const product = await this.fetchById(productId);
      const isOutOfStock = product.stock === 0;

      detailContainer.innerHTML = `
        <div class="detail-layout">
          <div class="detail-img-section">
            <img src="${product.image}" alt="${product.name}" class="detail-img">
            <span class="detail-category-tag">${product.category}</span>
          </div>
          <div class="detail-info-section">
            <h1 class="detail-title">${product.name}</h1>
            <div class="detail-price-row">
              <span class="detail-price">$${product.price.toFixed(2)}</span>
              <span class="detail-stock-badge ${isOutOfStock ? 'badge-out-of-stock' : 'badge-in-stock'}">
                ${isOutOfStock ? 'Sold Out' : `In Stock: ${product.stock} available`}
              </span>
            </div>
            <p class="detail-description">${product.description}</p>
            
            <div class="detail-purchase-controls">
              <div class="qty-select-wrapper">
                <label for="detail-qty" class="qty-lbl">Quantity:</label>
                <div class="qty-controls-row">
                  <button class="btn btn-qty-change minus-btn" ${isOutOfStock ? 'disabled' : ''}>-</button>
                  <input type="number" id="detail-qty" class="qty-input" value="1" min="1" max="${product.stock}" readonly ${isOutOfStock ? 'disabled' : ''}>
                  <button class="btn btn-qty-change plus-btn" ${isOutOfStock ? 'disabled' : ''}>+</button>
                </div>
              </div>

              <button id="add-to-cart-detail-btn" class="btn btn-primary btn-lg flex-grow-1" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      `;

      // Wire up Quantity Buttons
      const minusBtn = detailContainer.querySelector('.minus-btn');
      const plusBtn = detailContainer.querySelector('.plus-btn');
      const qtyInput = detailContainer.querySelector('#detail-qty');

      if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', () => {
          let val = Number(qtyInput.value);
          if (val > 1) {
            qtyInput.value = val - 1;
          }
        });
        plusBtn.addEventListener('click', () => {
          let val = Number(qtyInput.value);
          if (val < product.stock) {
            qtyInput.value = val + 1;
          }
        });
      }

      // Wire up Add to Cart Button
      const addToCartBtn = document.getElementById('add-to-cart-detail-btn');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async () => {
          const qty = Number(qtyInput.value) || 1;
          addToCartBtn.disabled = true;
          addToCartBtn.innerHTML = '<span class="loading-spinner-btn"></span> Adding...';
          try {
            await Cart.addItem(product, qty);
          } catch (e) {
            console.error(e);
          } finally {
            addToCartBtn.disabled = isOutOfStock;
            addToCartBtn.textContent = isOutOfStock ? 'Out of Stock' : 'Add to Cart';
          }
        });
      }

    } catch (err) {
      detailContainer.innerHTML = `
        <div class="error-state-details">
          <h3>Failed to load product details</h3>
          <p>${err.message}</p>
          <a href="index.html" class="btn btn-primary mt-2">Back to Shop</a>
        </div>
      `;
    }
  }
};
