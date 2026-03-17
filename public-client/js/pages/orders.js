const MyOrdersPage = {
  async render(params = {}) {
    const content = document.getElementById('page-content');
    const autoId = params.id || '';
    
    content.innerHTML = `
      <div class="fade-in-up" style="max-width:900px;margin:30px auto">
        <div class="card" style="padding:48px;text-align:center">
          <div style="margin-bottom:32px">
            <h1 style="font-size:2.5rem;margin-bottom:12px">Track Your <span style="color:var(--copper-light)">Order</span></h1>
            <p style="color:var(--text-secondary);font-size:1.1rem">Enter the Order ID provided in your confirmation message.</p>
          </div>
          
          <div style="max-width:500px;margin:0 auto;display:flex;gap:12px">
            <input class="input" id="track-id" placeholder="ORD2026869403" value="${Components.escapeHtml(autoId)}" style="font-family:monospace;letter-spacing:1px;text-align:center;font-size:1.1rem;padding:14px;border-color:var(--border-copper)">
            <button class="btn btn-primary" id="btn-track" onclick="MyOrdersPage.searchOrder()" style="padding:0 32px">Track →</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:16px">Example format: ORD2026XXXXXXXX</p>
        </div>

        <div id="my-orders-list" style="margin-top:32px">
          <!-- Order details will appear here -->
        </div>
      </div>
    `;

    if (autoId) {
      this.searchOrder();
    }
  },

  async searchOrder() {
    let id = document.getElementById('track-id').value.trim();
    if (!id) return Components.toast('Please enter a valid Order ID', 'warning');

    // Force uppercase for consistent lookup
    id = id.toUpperCase();
    document.getElementById('track-id').value = id;

    const list = document.getElementById('my-orders-list');
    list.innerHTML = Components.loading();

    try {
      const order = await API.trackOrder(id);
      this.renderOrders([order]);
    } catch (err) {
      list.innerHTML = `
        <div class="card" style="padding:40px;text-align:center;border-color:var(--danger)">
          <div style="font-size:3rem;margin-bottom:16px">🔍</div>
          <h3 style="color:var(--danger);margin-bottom:8px">Order Not Found</h3>
          <p style="color:var(--text-secondary)">We couldn't find an order with ID <strong>${Components.escapeHtml(id)}</strong>. <br>Please double check the ID and try again.</p>
        </div>
      `;
    }
  },

  renderOrders(orders) {
    const list = document.getElementById('my-orders-list');
    if (!orders || orders.length === 0) return;

    list.innerHTML = orders.map(o => {
      const isPending = o.status === 'Order Received';
      const statusColor = { 
        'Order Received': 'var(--copper-light)', 
        'Processing': '#3b82f6', 
        'Shipped': '#f59e0b', 
        'Out for Delivery': '#10b981', 
        'Delivered': 'var(--success)', 
        'Cancelled': 'var(--danger)' 
      }[o.status] || '#fff';
      
      return `
        <div class="card fade-in-up" style="padding:32px;background:var(--bg-secondary);border-color:var(--border-copper)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;gap:20px;flex-wrap:wrap">
            <div>
              <p style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px">Order ID</p>
              <h2 style="font-family:monospace;letter-spacing:1px;margin:0">${o.customId || o.id}</h2>
              <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px">Placed on ${Components.formatDate(o.createdAt)}</p>
            </div>
            <div style="text-align:right">
              <span style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);display:block;margin-bottom:4px">Current Status</span>
              <span style="display:inline-block;padding:8px 20px;border-radius:var(--radius-full);font-weight:800;font-size:0.9rem;background:rgba(${this.hexToRgb(statusColor)}, 0.1);color:${statusColor};border:1px solid rgba(${this.hexToRgb(statusColor)}, 0.2)">
                ${o.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style="margin-bottom:40px">
            ${this.renderProgressTracker(o.status, statusColor)}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding-top:32px;border-top:1px solid var(--border-subtle)">
            <div>
              <h4 style="margin-bottom:12px;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary)">Delivery Address</h4>
              <p style="font-size:0.95rem;line-height:1.6">${Components.escapeHtml(o.shippingAddress)}</p>
            </div>
            <div>
              <h4 style="margin-bottom:12px;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary)">Order Summary</h4>
              <div style="background:var(--bg-tertiary);padding:16px;border-radius:var(--radius-md)">
                ${o.items.map(i => `
                  <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:8px">
                    <span>${i.quantity}x ${Components.escapeHtml(i.name)}</span>
                    <span style="font-weight:600">${Components.formatPrice(i.subtotal)}</span>
                  </div>
                `).join('')}
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-bright);display:flex;justify-content:space-between;font-weight:800;color:var(--copper-light);font-size:1.1rem">
                  <span>Grand Total</span>
                  <span>${Components.formatPrice(o.total)}</span>
                </div>
              </div>
            </div>
          </div>

          ${isPending ? `
            <div style="margin-top:32px;display:flex;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm" onclick="MyOrdersPage.cancelOrder('${o.id}')" style="color:var(--danger)">Cancel Order</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  async cancelOrder(id) {
    if(!confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;
    try {
      await API.updateOrderPublic(id, { status: 'Cancelled' });
      Components.toast('Order cancelled successfully.', 'success');
      this.searchOrder();
    } catch (err) {
      Components.toast('Failed to cancel order: ' + err.message, 'error');
    }
  },
  
  renderProgressTracker(status, activeColor) {
    if (status === 'Cancelled') {
      return `
        <div style="padding: 24px; background: rgba(239, 68, 68, 0.05); border: 1px dashed var(--danger); border-radius: var(--radius-md); text-align: center">
          <p style="color: var(--danger); font-weight: 700; margin: 0">This order has been cancelled.</p>
        </div>
      `;
    }

    const stages = ['Order Received', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIndex = stages.indexOf(status);
    if (currentIndex === -1) return '';

    const labels = ['Received', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const icons = ['🛒', '⚙️', '🚛', '🛵', '📦'];

    let html = `<div style="display:flex; justify-content:space-between; position: relative; margin-top:20px; padding: 0 10px">`;
    // Background line
    html += `<div style="position:absolute; top:20px; left:40px; right:40px; height:4px; background:var(--bg-tertiary); border-radius:2px; z-index:1"></div>`;
    // Progress line
    const progressPerc = (currentIndex / (stages.length - 1)) * 100;
    html += `<div style="position:absolute; top:20px; left:40px; width:calc(${progressPerc}% - 80px); height:4px; background:${activeColor}; border-radius:2px; z-index:2; transition: width 0.8s ease; box-shadow: 0 0 10px ${activeColor}44"></div>`;

    stages.forEach((stage, i) => {
      const isCompleted = i <= currentIndex;
      const isCurrent = i === currentIndex;
      const color = isCompleted ? activeColor : 'var(--text-muted)';
      
      html += `
        <div style="display:flex; flex-direction:column; align-items:center; z-index:3; width: 80px">
          <div style="width:44px; height:44px; border-radius:50%; background:var(--bg-secondary); border:3px solid ${color}; display:flex; align-items:center; justify-content:center; box-shadow: ${isCurrent ? '0 0 20px ' + activeColor + '44' : 'none'}; transition: all 0.4s">
            <span style="font-size:20px; filter: ${isCompleted ? 'none' : 'grayscale(1) opacity(0.3)'}">${icons[i]}</span>
          </div>
          <span style="font-size:0.7rem; margin-top:12px; font-weight:${isCompleted ? '700' : '400'}; color:${isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'}; text-align:center; text-transform:uppercase; letter-spacing:0.5px">
            ${labels[i]}
          </span>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  },
  
  hexToRgb(hex) {
    if (hex.startsWith('var')) {
      // Handle CSS variables used in statusColor mapping
      if (hex.includes('success')) return '16, 185, 129';
      if (hex.includes('danger')) return '239, 68, 68';
      if (hex.includes('copper-light')) return '241, 183, 127';
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
  }
};
