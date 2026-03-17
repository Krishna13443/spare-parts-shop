const HomePage = {
  async render() {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const [catData, featData, allData] = await Promise.all([
        API.getCategories(),
        API.getProducts({ featured: 'true', limit: 6 }),
        API.getProducts({ limit: 8, sort: 'createdAt', order: 'DESC' }),
      ]);
      this.renderPage(catData, featData.products, allData.products);
    } catch (err) { c.innerHTML = Components.emptyState('⚠️', 'Failed to load'); Components.toast(err.message, 'error'); }
  },

  renderPage(categories, featured, latest) {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="hero fade-in-up">
        <div style="max-width:650px;position:relative;z-index:2">
          <h1 style="font-size:3.5rem">Premium <span style="color:var(--copper-light)">Industrial</span><br>Motor Spare Parts</h1>
          <p style="font-size:1.2rem;margin:20px 0 32px;opacity:0.9">Your trusted wholesale partner for high-grade submersible motors, copper winding wires, and heavy-duty pump accessories since 2005.</p>
          <div style="display:flex;gap:16px">
            <button class="btn btn-primary btn-lg" onclick="window.router.navigate('/products')" style="padding:16px 40px">Shop All Products →</button>
            <button class="btn btn-secondary btn-lg" onclick="window.router.navigate('/products')">View Categories</button>
          </div>
          <div style="display:flex;gap:40px;margin-top:48px;padding-top:32px;border-top:1px solid var(--border-bright)">
            <div><h2 style="font-size:2rem;color:var(--copper-light);margin-bottom:4px">500+</h2><span style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px">Products</span></div>
            <div><h2 style="font-size:2rem;color:var(--copper-light);margin-bottom:4px">20+</h2><span style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px">Years Exp</span></div>
            <div><h2 style="font-size:2rem;color:var(--copper-light);margin-bottom:4px">2k+</h2><span style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px">Clients</span></div>
          </div>
        </div>
      </div>

      <div class="section-header" style="margin-top:64px">
        <h2>Shop by <span style="color:var(--copper-light)">Category</span></h2>
        <button class="btn btn-ghost" onclick="window.router.navigate('/products')">Browse All →</button>
      </div>
      <div class="category-grid">
        ${categories.map((cat, i) => `
          <div class="category-card fade-in-up" style="animation-delay:${i*40}ms;padding:32px" onclick="window.router.navigate('/products?category=${cat._id || cat.id}')">
            <div class="cat-icon" style="font-size:2.5rem;margin-bottom:12px">${cat.icon || '⚙️'}</div>
            <div class="cat-name" style="font-size:1rem;margin-bottom:6px">${Components.escapeHtml(cat.name)}</div>
            <div class="cat-count" style="font-size:0.75rem;opacity:0.6">${cat.productCount || 0} products</div>
          </div>
        `).join('')}
      </div>

      ${featured.length ? `
        <div class="section-header" style="margin-top:64px">
          <h2>⭐ <span style="color:var(--copper-light)">Featured</span> Selections</h2>
          <button class="btn btn-secondary btn-sm" onclick="window.router.navigate('/products?featured=true')">View Collection →</button>
        </div>
        <div class="product-grid">${featured.map((p, i) => Components.productCard(p, i)).join('')}</div>
      ` : ''}

      <div style="margin-top:64px">
        <div class="section-header">
          <h2>🆕 <span style="color:var(--copper-light)">Latest</span> Arrivals</h2>
          <button class="btn btn-ghost btn-sm" onclick="window.router.navigate('/products')">See All →</button>
        </div>
        <div class="product-grid">${latest.map((p, i) => Components.productCard(p, i)).join('')}</div>
      </div>

      <div style="margin-top:80px;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px">
        <div class="card" style="padding:40px;text-align:center;border-color:rgba(16, 185, 129, 0.1)">
          <div style="font-size:2.5rem;margin-bottom:16px">🚚</div>
          <h3 style="margin-bottom:10px">Swift Dispatch</h3>
          <p style="color:var(--text-secondary);font-size:0.9rem">Orders processed and dispatched within 24 hours. Reliable shipping partner network across the region.</p>
        </div>
        <div class="card" style="padding:40px;text-align:center;border-color:rgba(59, 130, 246, 0.1)">
          <div style="font-size:2.5rem;margin-bottom:16px">🛡️</div>
          <h3 style="margin-bottom:10px">Quality Assured</h3>
          <p style="color:var(--text-secondary);font-size:0.9rem">Every part undergoes rigorous quality checks. Sourced from certified premium manufacturers only.</p>
        </div>
        <div class="card" style="padding:40px;text-align:center;border-color:rgba(212, 140, 77, 0.1)">
          <div style="font-size:2.5rem;margin-bottom:16px">💬</div>
          <h3 style="margin-bottom:10px">Expert Guidance</h3>
          <p style="color:var(--text-secondary);font-size:0.9rem">Need help choosing? Our technical team is just a call away for personalized spare parts advice.</p>
        </div>
      </div>
    `;
  },
};
