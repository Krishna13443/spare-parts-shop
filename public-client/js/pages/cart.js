const CartPage = {
  async render() {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const cart = await API.getCart();
      this.renderCart(cart);
    } catch (err) { c.innerHTML = Components.emptyState('🛒', 'Failed to load cart'); }
  },

  renderCart(cart) {
    const c = document.getElementById('page-content');
    const { items, total, count } = cart;

    if (!items.length) {
      c.innerHTML = `
        <div class="fade-in-up" style="max-width:800px;margin:40px auto;text-align:center">
          <div style="font-size:4rem;margin-bottom:24px;opacity:0.3">🛒</div>
          <h2 style="font-size:2rem;margin-bottom:12px">Your cart is empty</h2>
          <p style="color:var(--text-secondary);margin-bottom:32px">Looks like you haven't added any spare parts yet.</p>
          <button class="btn btn-primary btn-lg" onclick="window.router.navigate('/products')">Explore Products →</button>
        </div>
      `;
      return;
    }

    c.innerHTML = `
      <div class="fade-in-up">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px">
          <div>
            <h1 style="font-size:2.5rem;margin-bottom:4px">Your <span style="color:var(--copper-light)">Cart</span></h1>
            <p style="color:var(--text-secondary)">Review your items before proceeding to checkout</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="CartPage.clearAll()" style="color:var(--danger)">Clear All</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 380px;gap:32px">
          <div style="display:flex;flex-direction:column;gap:16px">
            ${items.map(item => {
              const p = item.product;
              if (!p) return '';
              const catName = p.category ? p.category.name : '';
              const icon = Components.productIcon(catName);
              return `
                <div class="card" style="padding:16px;display:flex;align-items:center;gap:20px;background:var(--bg-secondary)">
                  <div style="width:100px;height:100px;background:var(--bg-tertiary);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;flex-shrink:0">
                    ${p.images && p.images.length ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover">` : icon}
                  </div>
                  <div style="flex:1">
                    <div style="font-size:0.75rem;color:var(--copper-light);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${this.escapeHtml(catName)}</div>
                    <h4 style="margin-bottom:8px;cursor:pointer" onclick="window.router.navigate('/products/${p._id || p.id}')">${this.escapeHtml(p.name)}</h4>
                    <div style="font-weight:800;color:var(--text-primary);font-size:1.1rem">${Components.formatPrice(p.price)}</div>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:12px;min-width:120px">
                    <div style="display:flex;align-items:center;background:var(--bg-tertiary);border-radius:var(--radius-full);padding:4px;border:1px solid var(--border-subtle)">
                      <button class="qty-btn" style="border-radius:50%" onclick="CartPage.updateQty('${item.id}', ${item.quantity - 1})">−</button>
                      <span style="font-weight:700;width:40px;text-align:center;font-size:1.1rem">${item.quantity}</span>
                      <button class="qty-btn" style="border-radius:50%" onclick="CartPage.updateQty('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="btn btn-ghost btn-sm" style="font-size:0.75rem" onclick="CartPage.removeItem('${item.id}')">Remove Item</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <aside style="position:sticky;top:32px">
            <div class="card" style="padding:32px;border-color:var(--border-copper);background:var(--bg-secondary)">
              <h3 style="margin-bottom:24px;font-size:1.2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:16px">Order Summary</h3>
              
              <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:0.95rem;color:var(--text-secondary)">
                <span>Subtotal (${count} items)</span>
                <span>${Components.formatPrice(total)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:24px;font-size:0.95rem;color:var(--success)">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              
              <div style="display:flex;justify-content:space-between;font-size:1.4rem;font-weight:900;margin-bottom:32px;padding-top:20px;border-top:2px solid var(--border-bright)">
                <span>Total</span>
                <span style="color:var(--copper-light)">${Components.formatPrice(total)}</span>
              </div>

              <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;border-radius:var(--radius-md)" onclick="window.router.navigate('/checkout')">
                Proceed to Checkout →
              </button>
              
              <div style="margin-top:24px;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);display:flex;gap:12px;align-items:center">
                <span style="font-size:1.5rem">🛡️</span>
                <span style="font-size:0.75rem;color:var(--text-muted)">Secure checkout with SSL encryption and protected payments.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;
  },

  escapeHtml(s) { return Components.escapeHtml(s); },

  async updateQty(id, qty) {
    if (qty < 1) return this.removeItem(id);
    try { await API.updateCartItem(id, qty); App.updateCartBadge(); this.render(); } catch (err) { Components.toast(err.message, 'error'); }
  },

  async removeItem(id) {
    try { await API.removeCartItem(id); Components.toast('Item removed', 'success'); App.updateCartBadge(); this.render(); } catch (err) { Components.toast(err.message, 'error'); }
  },

  async clearAll() {
    try { await API.clearCart(); Components.toast('Cart cleared', 'success'); App.updateCartBadge(); this.render(); } catch (err) { Components.toast(err.message, 'error'); }
  },
};
