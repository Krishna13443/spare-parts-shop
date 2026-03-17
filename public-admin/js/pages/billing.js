const BillingPage = {
  items: [],
  products: [],

  async render() {
    if (!App.user || App.user.role !== 'admin') {
      document.getElementById('page-content').innerHTML = Components.emptyState('🔒', 'Admin access required', '<button class="btn btn-primary" onclick="window.router.navigate(\'/auth\')">Login as Admin</button>');
      return;
    }
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const data = await API.getProducts({ limit: 500 });
      this.products = data.products;
      this.items = [];
      this.renderBilling();
    } catch (err) { c.innerHTML = Components.emptyState('⚠️', 'Failed to load billing system'); }
  },

  renderBilling() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="section-header">
        <h2>📜 E-Billing <span>System</span></h2>
        <div style="display:flex;gap:12px">
          <button class="btn btn-secondary" id="btn-save-bill">💾 Save Bill</button>
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print Bill</button>
        </div>
      </div>

      <div class="billing-container" style="display:grid;grid-template-columns:1fr 400px;gap:24px">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h3 style="margin:0">Invoice Details</h3>
            <div style="font-size:0.9rem;color:var(--text-muted)">Date: ${new Date().toLocaleDateString()}</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px" class="no-print">
            <div>
              <label style="display:block;font-size:0.75rem;margin-bottom:4px;color:var(--text-secondary)">Customer Name</label>
              <input type="text" id="bill-cust-name" class="input" placeholder="Guest Customer">
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;margin-bottom:4px;color:var(--text-secondary)">Customer Phone</label>
              <input type="text" id="bill-cust-phone" class="input" placeholder="9999999999">
            </div>
          </div>

          <div class="table-container">
            <table id="billing-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price (₹)</th>
                  <th style="width:100px">Qty</th>
                  <th>Subtotal</th>
                  <th class="no-print"></th>
                </tr>
              </thead>
              <tbody id="billing-items">
                ${this.items.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">No items added to bill yet</td></tr>' : this.items.map((item, index) => `
                  <tr>
                    <td style="font-weight:600">${Components.escapeHtml(item.name)}</td>
                    <td>${Components.formatPrice(item.price)}</td>
                    <td>
                      <input type="number" class="input" value="${item.qty}" min="1" 
                        onchange="BillingPage.updateItemQty(${index}, this.value)" 
                        style="width:70px;padding:4px;text-align:center">
                    </td>
                    <td style="font-weight:700">${Components.formatPrice(item.price * item.qty)}</td>
                    <td class="no-print">
                      <button class="btn btn-ghost btn-sm" onclick="BillingPage.removeItem(${index})">🗑</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-top:24px;display:flex;justify-content:flex-end">
            <div style="text-align:right;min-width:200px">
              <div style="display:flex;justify-content:space-between;padding:4px 0;color:var(--text-secondary)">
                <span>Subtotal:</span>
                <span>${Components.formatPrice(this.calculateTotal())}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--border-subtle);margin-top:8px">
                <strong style="font-size:1.4rem">Grand Total:</strong>
                <strong style="font-size:1.4rem;color:var(--copper-light)">${Components.formatPrice(this.calculateTotal())}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="card no-print">
          <h3 style="margin-bottom:16px">Add Products</h3>
          <div class="input-group">
            <input type="text" class="input" id="item-search" placeholder="Search product by name..." oninput="BillingPage.searchProducts(this.value)">
          </div>
          <div id="search-results" style="max-height:400px;overflow-y:auto;background:var(--bg-tertiary);border-radius:8px">
            <!-- Search results populated here -->
          </div>
        </div>
      </div>

      <div class="print-only invoice-header">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;border-bottom:2px solid #000;padding-bottom:20px">
          <div>
            <h1 style="margin:0;color:#000">SparkMotors</h1>
            <p style="margin:4px 0;font-size:0.9rem">Industrial Area, Phase 2<br>GSTIN: 29AAAAA0000A1Z5</p>
          </div>
          <div style="text-align:right">
            <h2 style="margin:0">TAX INVOICE</h2>
            <p style="margin:4px 0">Bill No: SM-${Date.now().toString().slice(-6)}<br>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-save-bill').addEventListener('click', () => this.saveBill());
  },

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  searchProducts(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!query || query.length < 2) {
      resultsContainer.innerHTML = '';
      return;
    }

    const filtered = this.products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    resultsContainer.innerHTML = filtered.map(p => `
      <div class="search-item" onclick="BillingPage.addItem('${p.id}')" style="padding:12px;border-bottom:1px solid var(--border-subtle);cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:600;font-size:0.9rem">${Components.escapeHtml(p.name)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Stock: ${p.stock}</div>
        </div>
        <div style="color:var(--copper-light);font-weight:700">${Components.formatPrice(p.price)}</div>
      </div>
    `).join('');
  },

  addItem(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existing = this.items.find(item => item.productId === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      });
    }
    
    document.getElementById('item-search').value = '';
    document.getElementById('search-results').innerHTML = '';
    this.renderBilling();
  },

  updateItemQty(index, qty) {
    const q = parseInt(qty);
    if (isNaN(q) || q < 1) return;
    this.items[index].qty = q;
    this.renderBilling();
  },

  async saveBill() {
    if (this.items.length === 0) {
      Components.toast('Add items to the bill first', 'warning');
      return;
    }

    const name = document.getElementById('bill-cust-name').value.trim();
    const phone = document.getElementById('bill-cust-phone').value.trim();

    try {
      const btn = document.getElementById('btn-save-bill');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      await API.saveInvoice({
        items: this.items,
        customerName: name || 'In-Store Customer',
        customerPhone: phone || '9999999999',
        paymentMethod: 'cash'
      });

      Components.toast('Bill saved and stock updated', 'success');
      this.items = [];
      this.render();
    } catch (err) {
      Components.toast(err.message, 'error');
    }
  },

  removeItem(index) {
    this.items.splice(index, 1);
    this.renderBilling();
  }
};
