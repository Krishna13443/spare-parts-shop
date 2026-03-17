const Components = {
  toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='all 300ms'; setTimeout(()=>t.remove(),300); }, 3000);
  },

  openModal(title, body, footer = '') {
    document.querySelector('.modal-overlay')?.remove();
    const o = document.createElement('div');
    o.className = 'modal-overlay';
    o.innerHTML = `<div class="modal"><div class="modal-header"><h2>${title}</h2><button class="btn btn-ghost btn-icon" onclick="Components.closeModal()">✕</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div>`;
    o.addEventListener('click', e => { if(e.target===o) Components.closeModal(); });
    document.body.appendChild(o);
  },
  closeModal() { document.querySelector('.modal-overlay')?.remove(); },

  formatPrice(p) { return `₹${Number(p).toLocaleString('en-IN')}`; },

  escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },

  formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'; },

  statusBadge(s) { 
    const slug = s ? s.toLowerCase().replace(/\s+/g, '-') : 'pending';
    return `<span class="badge badge-${slug}">${s || 'Pending'}</span>`; 
  },

  loading() { return `<div class="loading-overlay"><div class="loading-spinner"></div></div>`; },

  emptyState(icon, msg, btn = '') { return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p>${btn}</div>`; },

  stars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  },

  productIcon(categoryName) {
    const icons = {
      'Submersible Motors': '⚡', 'Copper Winding Wire': '🟤', 'Capacitors': '🔋',
      'Pump Accessories': '🔧', 'Control Panels': '🎛️', 'Pipes & Fittings': '🔩',
    };
    return icons[categoryName] || '⚙️';
  },

  productCard(p, idx = 0) {
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const catName = p.category ? p.category.name : '';
    const icon = this.productIcon(catName);
    return `
      <div class="product-card fade-in-up" style="animation-delay:${idx*50}ms" onclick="window.router.navigate('/products/${p.id}')">
        <div class="product-image">
          <span>${icon}</span>
          ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
          ${p.featured ? `<span class="featured-badge">Featured</span>` : ''}
        </div>
        <div class="product-body">
          <div class="product-category">${this.escapeHtml(catName)}</div>
          <div class="product-name">${this.escapeHtml(p.name)}</div>
          <div class="product-price-row">
            <span class="product-price">${this.formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="product-original-price">${this.formatPrice(p.originalPrice)}</span>` : ''}
          </div>
          <div class="product-rating">${this.stars(p.rating)} <span style="color:var(--text-muted)">${p.rating}</span></div>
          <div class="product-stock ${p.stock < 10 ? 'low' : ''}">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div>
        </div>
        <div class="product-footer">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); App.addToCart('${p.id}')" ${p.stock===0?'disabled':''}>Add to Cart</button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.router.navigate('/products/${p.id}')">View</button>
        </div>
      </div>
    `;
  },
};
