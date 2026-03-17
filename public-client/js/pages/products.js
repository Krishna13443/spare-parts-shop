const ProductsPage = {
  categories: [],
  activeCategory: '',
  searchQuery: '',

  async render(params = {}) {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    this.activeCategory = params.category || '';
    this.searchQuery = params.search || '';
    try {
      this.categories = await API.getCategories();
      const queryParams = { limit: 50 };
      if (this.activeCategory) queryParams.category = this.activeCategory;
      if (this.searchQuery) queryParams.search = this.searchQuery;
      if (params.featured) queryParams.featured = 'true';
      const data = await API.getProducts(queryParams);
      this.renderPage(data);
    } catch (err) { c.innerHTML = Components.emptyState('⚠️', 'Failed to load products'); }
  },

  renderPage(data) {
    const c = document.getElementById('page-content');
    const { products, total } = data;
    const activeCat = this.categories.find(cat => (cat._id || cat.id) === this.activeCategory);

    c.innerHTML = `
      <div class="fade-in-up">
        <div style="margin-bottom:40px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap">
          <div>
            <h1 style="font-size:2rem;margin-bottom:4px">${activeCat ? Components.escapeHtml(activeCat.name) : 'Our <span style="color:var(--copper-light)">Catalog</span>'}</h1>
            <p style="color:var(--text-secondary);font-size:0.9rem">Showing ${total} premium quality product${total!==1?'s':''}</p>
          </div>
          <div class="search-bar" style="max-width:350px;width:100%">
            <span class="search-icon">🔍</span>
            <input class="input" id="product-search" type="text" placeholder="Search industrial parts..." value="${this.searchQuery}" style="border-radius:var(--radius-full);padding-left:44px;background:var(--bg-secondary);border-color:var(--border-copper)">
          </div>
        </div>

        <div class="products-layout">
          <aside class="filter-sidebar">
            <div class="card" style="padding:24px;background:var(--bg-secondary)">
              <h4 style="margin-bottom:16px;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Categories</h4>
              <div class="filter-option ${!this.activeCategory?'active':''}" onclick="ProductsPage.filterByCategory('')" style="padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:4px">
                📦 All Products
              </div>
              ${this.categories.map(cat => `
                <div class="filter-option ${this.activeCategory===(cat._id || cat.id)?'active':''}" onclick="ProductsPage.filterByCategory('${cat._id || cat.id}')" style="padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:4px">
                  ${cat.icon || '⚙️'} ${Components.escapeHtml(cat.name)}
                </div>
              `).join('')}
            </div>
            
            <div class="card" style="margin-top:20px;padding:20px;background:var(--dark-gradient);border:1px dashed var(--border-copper)">
              <h4 style="font-size:0.75rem;margin-bottom:8px">Need custom parts?</h4>
              <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:12px">Contact our technical team for specialized bulk orders.</p>
              <button class="btn btn-secondary btn-sm" style="width:100%">Enquire Now</button>
            </div>
          </aside>

          <main>
            <div class="product-grid" id="product-grid">
              ${products.length
                ? products.map((p, i) => Components.productCard(p, i)).join('')
                : `
                  <div style="grid-column:1/-1;padding:80px 0">
                    ${Components.emptyState('🔍', `No products found matching "${this.searchQuery}"`, `<button class="btn btn-secondary" onclick="ProductsPage.clearFilters()">Clear Filters</button>`)}
                  </div>
                `
              }
            </div>
          </main>
        </div>
      </div>
    `;

    document.getElementById('product-search').focus();
    let searchTimeout;
    document.getElementById('product-search').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      this.searchQuery = e.target.value;
      searchTimeout = setTimeout(() => {
        this.render({ category: this.activeCategory, search: this.searchQuery });
      }, 500);
    });
  },

  filterByCategory(catId) {
    this.activeCategory = catId;
    this.render({ category: catId, search: this.searchQuery });
  },

  clearFilters() {
    this.activeCategory = '';
    this.searchQuery = '';
    this.render();
  }
};
