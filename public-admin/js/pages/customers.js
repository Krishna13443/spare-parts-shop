const CustomersPage = {
  async render() {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const { orders } = await API.getOrders({ limit: 1000 });
      
      // Extract unique customers based on Phone number
      const customersMap = new Map();
      orders.forEach(o => {
        const key = o.customerPhone;
        if (!customersMap.has(key)) {
          customersMap.set(key, {
            name: o.customerName,
            email: o.customerEmail,
            phone: o.customerPhone,
            address: o.shippingAddress,
            orderCount: 0,
            totalSpent: 0,
            lastOrder: o.createdAt
          });
        }
        const cust = customersMap.get(key);
        cust.orderCount++;
        cust.totalSpent += o.total;
        if (new Date(o.createdAt) > new Date(cust.lastOrder)) {
          cust.lastOrder = o.createdAt;
        }
      });

      const customers = Array.from(customersMap.values());
      this.renderList(customers);
    } catch (err) {
      c.innerHTML = Components.emptyState('👥', 'Failed to load customers. ' + err.message);
    }
  },

  renderList(customers) {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="section-header">
        <h2>👥 Customer <span>Database</span></h2>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" class="input" placeholder="Search by name or phone..." oninput="CustomersPage.filterTable(this.value)">
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="customer-table-body">
              ${customers.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No customers found</td></tr>' : customers.map(cust => `
                <tr>
                  <td>
                    <div style="font-weight:700;font-size:1rem">${Components.escapeHtml(cust.name)}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">📱 ${cust.phone}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">📧 ${cust.email}</div>
                  </td>
                  <td>
                    <div class="badge badge-confirmed">${cust.orderCount} Orders</div>
                  </td>
                  <td>
                    <div style="color:var(--copper-light);font-weight:800;font-size:1.1rem">${Components.formatPrice(cust.totalSpent)}</div>
                  </td>
                  <td>
                    <div style="font-size:0.85rem">${Components.formatDate(cust.lastOrder)}</div>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="CustomersPage.viewDetails('${cust.phone}')">📑 View History</button>
                    <a href="tel:${cust.phone}" class="btn btn-ghost btn-sm" style="color:var(--info)">📞 Call</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  filterTable(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#customer-table-body tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  },

  async viewDetails(phone) {
    try {
      const { orders } = await API.getOrders({ limit: 1000 });
      const customerOrders = orders.filter(o => o.customerPhone === phone);
      const customer = customerOrders[0];

      Components.openModal('Customer Order History', `
        <div style="margin-bottom:20px">
          <h3 style="margin-bottom:8px">${Components.escapeHtml(customer.customerName)}</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary)">
            <strong>Phone:</strong> ${customer.customerPhone}<br>
            <strong>Default Address:</strong> ${customer.shippingAddress}
          </p>
        </div>
        <div class="table-container" style="max-height:400px;overflow-y:auto">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${customerOrders.map(o => `
                <tr>
                  <td style="font-family:monospace;font-size:0.75rem">#${o.id.slice(0,8)}</td>
                  <td style="font-size:0.85rem">${Components.formatDate(o.createdAt)}</td>
                  <td style="font-weight:700">${Components.formatPrice(o.total)}</td>
                  <td>${Components.statusBadge(o.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `, `
        <button class="btn btn-secondary" onclick="Components.closeModal()">Close</button>
      `);
    } catch (err) {
      Components.toast('Failed to load history', 'error');
    }
  }
};
