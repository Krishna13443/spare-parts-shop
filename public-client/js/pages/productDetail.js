const ProductDetailPage = {
  async render(id) {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const product = await API.getProduct(id);
      this.renderDetail(product);
    } catch (err) { c.innerHTML = Components.emptyState('⚠️', 'Product not found'); }
  },

  renderDetail(p) {
    const c = document.getElementById('page-content');
    const catName = p.category ? p.category.name : '';
    const icon = Components.productIcon(catName);
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const specs = p.specifications || {};

    c.innerHTML = `
      <button class="back-link" onclick="window.router.navigate('/products')">← Back to Products</button>
      
      <div class="product-detail">
        <div class="product-detail-hero-section">
          ${Components.productImageGallery(p.images, p.name, icon)}
        </div>
        <div class="product-detail-info">
          <div style="font-size:0.75rem;color:var(--copper-light);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:8px">${Components.escapeHtml(catName)}</div>
          <h1>${Components.escapeHtml(p.name)}</h1>
          <div style="color:var(--warning);margin:8px 0">${Components.stars(p.rating)} <span style="color:var(--text-muted)">(${p.rating}/5)</span></div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">SKU: ${p.sku || '—'}</div>
          
          <div class="price-section">
            <span class="detail-price">${Components.formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="detail-original">${Components.formatPrice(p.originalPrice)}</span>` : ''}
            ${discount > 0 ? `<span class="detail-discount">${discount}% OFF</span>` : ''}
          </div>

          <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin-bottom:24px">${Components.escapeHtml(p.description)}</p>

          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
            <span style="font-size:0.85rem;color:${p.stock>0?'var(--success)':'var(--danger)'}">
              ${p.stock > 0 ? `✓ ${p.stock} in stock` : '✗ Out of stock'}
            </span>
          </div>

          <div style="display:flex;gap:12px;margin-bottom:32px">
            <button class="btn btn-primary btn-lg" onclick="App.addToCart('${p.id}')" ${p.stock===0?'disabled':''}>🛒 Add to Cart</button>
            <button class="btn btn-secondary btn-lg" onclick="App.addToCart('${p.id}');window.router.navigate('/cart')" ${p.stock===0?'disabled':''}>Buy Now</button>
          </div>

          ${Object.keys(specs).length ? `
            <h3 style="margin-bottom:12px;font-size:1rem">Specifications</h3>
            <table class="specs-table">
              ${Object.entries(specs).map(([k, v]) => `
                <tr><td>${k.replace(/_/g,' ')}</td><td style="color:var(--text-primary);font-weight:500">${v}</td></tr>
              `).join('')}
            </table>
          ` : ''}
        </div>
      </div>
    `;
  },
};
