const Components = {
  toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { 
      t.style.opacity='0'; 
      t.style.transform='translateX(100%)'; 
      t.style.transition='all 300ms cubic-bezier(0.4, 0, 0.2, 1)'; 
      setTimeout(()=>t.remove(),300); 
    }, 4000);
  },

  openModal(title, body, footer = '') {
    document.querySelector('.modal-overlay')?.remove();
    const o = document.createElement('div');
    o.className = 'modal-overlay';
    o.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="btn btn-ghost btn-icon" onclick="Components.closeModal()">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    o.addEventListener('click', e => { if(e.target===o) Components.closeModal(); });
    document.body.appendChild(o);
  },
  closeModal() { document.querySelector('.modal-overlay')?.remove(); },

  formatPrice(p) { return `₹${Number(p).toLocaleString('en-IN')}`; },

  escapeHtml(s) { if(!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; },

  formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'; },

  statusBadge(s) { 
    const slug = s ? s.toLowerCase().replace(/\s+/g, '-') : 'pending';
    return `<span class="badge badge-${slug}">${s || 'Pending'}</span>`; 
  },

  loading() { return `<div class="loading-overlay"><div class="loading-spinner"></div></div>`; },

  emptyState(icon, msg, btn = '') { return `<div class="empty-state"><div class="empty-icon">${icon}</div><p style="margin-bottom:16px">${msg}</p>${btn}</div>`; },

  stars(rating) {
    const full = Math.floor(rating || 0);
    const half = (rating || 0) % 1 >= 0.5 ? 1 : 0;
    return '<span style="color:var(--warning)">' + '★'.repeat(full) + (half ? '½' : '') + '</span>' + '<span style="color:var(--text-muted)">' + '☆'.repeat(5 - full - half) + '</span>';
  },

  productIcon(categoryName) {
    const icons = {
      'Submersible Motors': '⚡', 'Copper Winding Wire': '🟤', 'Capacitors': '🔋',
      'Pump Accessories': '🔧', 'Control Panels': '🎛️', 'Pipes & Fittings': '🔩',
    };
    return icons[categoryName] || '⚙️';
  },

  productCard(p, idx = 0) {
    if (!p) return '';
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const catName = p.category ? (p.category.name || '') : '';
    const icon = this.productIcon(catName);
    return `
      <div class="product-card fade-in-up" style="animation-delay:${idx*40}ms" onclick="window.router.navigate('/products/${p.id}')">
        <div class="product-image">
          ${p.images && p.images.length > 0 
            ? `<img src="${p.images[0]}" alt="${this.escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">` 
            : (p.image 
                ? `<img src="${p.image}" alt="${this.escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">` 
                : `<span style="font-size:3.5rem;opacity:0.6">${icon}</span>`
              )
          }
          ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
          ${p.featured ? `<span class="featured-badge">Featured</span>` : ''}
        </div>
        <div class="product-body">
          <div class="product-category">${this.escapeHtml(catName)}</div>
          <h4 class="product-name" style="height:2.6em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${this.escapeHtml(p.name)}</h4>
          <div class="product-price-row">
            <span class="product-price">${this.formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="product-original-price">${this.formatPrice(p.originalPrice)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px">
            <div class="product-rating">${this.stars(p.rating)}</div>
            <div class="product-stock ${p.stock < 10 ? 'low' : ''}" style="font-size:0.7rem">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div>
          </div>
        </div>
        <div class="product-footer">
          <button class="btn btn-secondary btn-sm" style="flex:1;justify-content:center" onclick="event.stopPropagation(); App.addToCart('${p.id}')" ${p.stock===0?'disabled':''}>Add to Cart</button>
          <button class="btn btn-primary btn-sm" style="flex:1.2;justify-content:center" onclick="event.stopPropagation(); App.addToCart('${p.id}'); window.router.navigate('/checkout')" ${p.stock===0?'disabled':''}>Order Now</button>
        </div>
      </div>
    `;
  },

  productImageGallery(images, productName, defaultIcon) {
    if (!images || images.length === 0) return `<div class="product-detail-hero-image"><span>${defaultIcon}</span></div>`;
    
    return `
      <div class="product-gallery">
        <div class="main-image-container">
          <img id="main-product-image" src="${images[0]}" alt="${this.escapeHtml(productName)}">
        </div>
        ${images.length > 1 ? `
          <div class="thumbnail-list">
            ${images.map((img, i) => `
              <div class="thumbnail ${i===0?'active':''}" onclick="Components.setMainImage(this, '${img}')">
                <img src="${img}" alt="Thumbnail ${i+1}">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  setMainImage(thumbEl, imgSrc) {
    const mainImg = document.getElementById('main-product-image');
    if (mainImg) mainImg.src = imgSrc;
    
    // Update active state
    thumbEl.parentElement.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbEl.classList.add('active');
  },
};
