const OrdersPage = {
  async render() {
    if (!App.user || App.user.role !== 'admin') {
      document.getElementById('page-content').innerHTML = Components.emptyState('🔒', 'Admin access required', '<button class="btn btn-primary" onclick="window.router.navigate(\'/auth\')">Login as Admin</button>');
      return;
    }
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="admin-header">
        <h2>📦 Order Management</h2>
        <div class="admin-actions">
          <button class="btn btn-secondary" onclick="OrdersPage.loadOrders()">Refresh</button>
        </div>
      </div>
      <div class="card" style="margin-top: 20px;">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%;">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-orders-table-body">
              <tr><td colspan="7" style="text-align:center;padding:20px;">Loading orders...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    this.loadOrders();
  },

  async loadOrders() {
    try {
      const data = await API.getOrders();
      this.renderOrders(data.orders || []);
    } catch (err) {
      Components.toast('Failed to load orders: ' + err.message, 'error');
    }
  },

  renderOrders(orders) {
    const t = document.getElementById('admin-orders-table-body');
    if (orders.length === 0) {
      t.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No orders found.</td></tr>';
      return;
    }

    t.innerHTML = orders.map(o => {
      const isCancelled = o.status === 'Cancelled';
      const statusOptions = ['Order Received', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
        .map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`)
        .join('');

      return `
        <tr>
          <td>#${o.id}</td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>${Components.escapeHtml(o.shopName || o.customerName)}<br><small style="color:var(--text-muted)">${Components.escapeHtml(o.city || o.customerPhone)}</small></td>
          <td>₹${o.total.toFixed(2)}</td>
          <td>${(o.paymentMethod || 'COD').toUpperCase()}</td>
          <td>
            <select class="input" style="padding:4px;width:auto;min-width:140px" 
                onchange="OrdersPage.updateStatus('${o.id}', this.value)" 
                ${isCancelled ? 'disabled title="Cancelled orders cannot be modified"' : ''}>
              ${statusOptions}
            </select>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="OrdersPage.viewDetails('${o.id}')">👁️ View Details</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateStatus(id, newStatus) {
    try {
      await API.updateOrder(id, { status: newStatus });
      Components.toast('Order status updated successfully', 'success');
      this.loadOrders();
    } catch (err) {
      Components.toast('Failed to update status: ' + err.message, 'error');
      this.loadOrders(); // Revert select visually
    }
  },

  async viewDetails(id) {
    try {
      const o = await API.getOrder(id);
      
      const itemsList = o.items.map(i => `
        <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border);align-items:center;">
          <div>
            <strong>${Components.escapeHtml(i.name)}</strong><br>
            <small style="color:var(--text-muted)">₹${i.price} x ${i.quantity}</small>
          </div>
          <div>₹${i.subtotal}</div>
        </div>
      `).join('');

      Components.openModal('Order Details #ORD-' + o.id, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div class="card" style="margin:0;box-shadow:none;border:1px solid var(--border)">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${Components.escapeHtml(o.customerName)}</p>
            <p><strong>Shop:</strong> ${Components.escapeHtml(o.shopName || '—')}</p>
            <p><strong>Phone:</strong> ${Components.escapeHtml(o.customerPhone || 'N/A')}</p>
          </div>
          <div class="card" style="margin:0;box-shadow:none;border:1px solid var(--border)">
            <h4>Shipping Information</h4>
            <div style="font-size:0.9rem;line-height:1.5">
              <strong>Address:</strong> ${Components.escapeHtml(o.addressLines || '—')}<br>
              <strong>City:</strong> ${Components.escapeHtml(o.city || '—')}<br>
              <strong>PIN:</strong> ${Components.escapeHtml(o.pincode || '—')}<br>
              <strong>Landmark:</strong> ${Components.escapeHtml(o.landmark || '—')}
            </div>
            <p style="margin-top:10px"><strong>Payment:</strong> <span style="text-transform:uppercase;background:var(--bg-accent);padding:2px 6px;border-radius:4px;font-size:0.8rem">${o.paymentMethod}</span></p>
          </div>
        </div>
        
        <div class="card" style="margin:0;box-shadow:none;border:1px solid var(--border)">
          <h4 style="padding:16px 16px 0;">Purchased Items</h4>
          ${itemsList}
          <div style="display:flex;justify-content:space-between;padding:16px;font-size:1.1rem;font-weight:600;background:var(--bg-accent);">
            <div>Total Order Value</div>
            <div style="color:var(--copper-light)">₹${o.total.toFixed(2)}</div>
          </div>
        </div>
        <div style="margin-top:20px;text-align:right">
            <button class="btn btn-secondary" onclick="Components.closeModal()">Close</button>
        </div>
      `);
    } catch (err) {
      Components.toast('Failed to load details: ' + err.message, 'error');
    }
  }
};
