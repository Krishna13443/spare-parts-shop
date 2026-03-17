const ChallengePage = {
  activeView: 'dashboard', // or 'orders'
  widgets: [],
  orders: [],

  async render() {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const [wRes, oRes] = await Promise.all([
        API.getWidgets(),
        API.getChallengeOrders()
      ]);
      this.widgets = (wRes.widgets || []).filter(w => w);
      this.orders = (oRes.orders || []).filter(o => o);

      if (this.activeView === 'dashboard') {
        this.renderDashboard();
      } else {
        this.renderOrders();
      }
    } catch (err) {
      c.innerHTML = Components.emptyState('🏆', 'Challenge initialized. Get started by creating your first order or widget.', `
        <button class="btn btn-primary" onclick="ChallengePage.openOrderModal()">+ New Order</button>
        <button class="btn btn-secondary" onclick="ChallengePage.openWidgetModal()">+ Add Widget</button>
      `);
    }
  },

  renderDashboard() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="section-header">
        <h2>🛠️ Dynamic <span>Insights Dashboard</span></h2>
        <div style="display:flex;gap:12px">
          <button class="btn btn-secondary" onclick="ChallengePage.switchView('orders')">📋 Manage Orders</button>
          <button class="btn btn-primary" onclick="ChallengePage.openWidgetModal()">+ Add Widget</button>
        </div>
      </div>

      <div class="widget-grid">
        ${this.widgets.length === 0 ? `
          <div class="col-12 card" style="text-align:center;padding:60px">
            <h3 style="margin-bottom:12px">No widgets found</h3>
            <p style="color:var(--text-muted);margin-bottom:24px">Design your custom dashboard using the available data!</p>
            <button class="btn btn-primary" onclick="ChallengePage.openWidgetModal()">+ Create Your First Widget</button>
          </div>
        ` : this.widgets.map(w => `
          <div class="widget-card col-${w.width}" style="grid-row: span ${w.height}">
            <div class="widget-header">
              <span class="widget-title">${Components.escapeHtml(w.title)}</span>
              <div style="display:flex;gap:4px">
                <button class="btn btn-ghost btn-sm" onclick="ChallengePage.openWidgetModal('${w._id}')">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="ChallengePage.deleteWidget('${w._id}')">🗑️</button>
              </div>
            </div>
            <div class="widget-content" id="widget-container-${w._id}">
              ${this.renderWidgetPlaceholder(w)}
            </div>
            ${w.description ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px">${Components.escapeHtml(w.description)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    // Initialize Widget Data
    this.widgets.forEach(w => this.initWidget(w));
  },

  renderOrders() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="section-header">
        <h2>📋 Customer <span>Order List</span></h2>
        <div style="display:flex;gap:12px">
          <button class="btn btn-secondary" onclick="ChallengePage.switchView('dashboard')">🏠 Dashboard View</button>
          <button class="btn btn-primary" onclick="ChallengePage.openOrderModal()">+ New Order</button>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total ($)</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.orders.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No orders found</td></tr>' : this.orders.map(o => `
                <tr>
                  <td>
                    <div style="font-weight:700">${Components.escapeHtml(o.firstName)} ${Components.escapeHtml(o.lastName)}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${o.emailId}</div>
                  </td>
                  <td>${o.product}</td>
                  <td>${o.quantity}</td>
                  <td style="font-weight:700;color:var(--copper-light)">$${o.totalAmount.toFixed(2)}</td>
                  <td><span class="badge ${o.status === 'Completed' ? 'badge-delivered' : o.status === 'In progress' ? 'badge-confirmed' : 'badge-pending'}">${o.status}</span></td>
                  <td style="font-size:0.8rem">${o.createdBy}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="ChallengePage.openOrderModal('${o._id}')">✏️ Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="ChallengePage.deleteOrder('${o._id}')">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  switchView(v) {
    this.activeView = v;
    this.render();
  },

  renderWidgetPlaceholder(w) {
    if (w.type === 'Table') return `<div class="table-container" style="border:none" id="table-${w._id}"></div>`;
    return `<canvas id="chart-${w._id}"></canvas>`;
  },

  async initWidget(w) {
    const containerId = w.type === 'Table' ? `table-${w._id}` : `chart-${w._id}`;
    const el = document.getElementById(containerId);
    if (!el) return;

    if (w.type === 'Table') {
      this.initTableWidget(w, el);
    } else {
      this.initChartWidget(w, el);
    }
  },

  initTableWidget(w, el) {
    const cols = w.dataSettings.columns || ['Customer name', 'Order ID', 'Product', 'Total amount', 'Status'];
    const colMap = {
      'Customer ID': 'id',
      'Customer name': (o) => `${o.firstName} ${o.lastName}`,
      'Email id': 'emailId',
      'Phone number': 'phoneNumber',
      'Address': 'streetAddress',
      'Order ID': '_id',
      'Order date': (o) => new Date(o.createdAt).toLocaleDateString(),
      'Product': 'product',
      'Quantity': 'quantity',
      'Unit price': 'unitPrice',
      'Total amount': 'totalAmount',
      'Status': 'status',
      'Created by': 'createdBy'
    };

    let data = [...this.orders];
    
    // Sort logic
    if (w.dataSettings.sortBy === 'Order date') {
       data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (w.dataSettings.sortBy === 'Descending') {
       data.sort((a,b) => b.totalAmount - a.totalAmount);
    } else if (w.dataSettings.sortBy === 'Ascending') {
       data.sort((a,b) => a.totalAmount - b.totalAmount);
    }

    // Pagination
    const limit = w.dataSettings.pagination || 10;
    data = data.slice(0, limit);

    const fSize = w.styling.fontSize || 14;
    const hBg = w.styling.headerBackground || '#54bd95';

    el.innerHTML = `
      <table style="font-size:${fSize}px">
        <thead>
          <tr>
            ${cols.map(c => `<th style="background:${hBg};color:#000">${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(o => `
            <tr>
              ${cols.map(c => {
                const map = colMap[c];
                const val = typeof map === 'function' ? map(o) : o[map];
                return `<td>${val === undefined ? '-' : val}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  initChartWidget(w, canvas) {
    const ctx = canvas.getContext('2d');
    const dataKey = w.dataSettings.xAxis || 'Product';
    const valueKey = w.dataSettings.yAxis || w.dataSettings.chartData || 'Total amount';

    const color = w.styling.chartColor || '#c97d3c';

    // Aggregate data
    const agg = {};
    const labelMapping = {
       'Product': 'product',
       'Status': 'status',
       'Created by': 'createdBy'
    };

    const valueMapping = {
       'Quantity': 'quantity',
       'Total amount': 'totalAmount',
       'Unit price': 'unitPrice'
    };

    this.orders.forEach(o => {
      const label = o[labelMapping[dataKey] || 'product'];
      const val = o[valueMapping[valueKey] || 'totalAmount'];
      agg[label] = (agg[label] || 0) + val;
    });

    const labels = Object.keys(agg);
    const dataset = Object.values(agg);

    let chartType = 'bar';
    if (w.type === 'Pie chart') chartType = 'pie';
    if (w.type === 'Line chart') chartType = 'line';
    if (w.type === 'Area chart') chartType = 'line'; // handles via fill

    new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          label: valueKey,
          data: dataset,
          backgroundColor: w.type === 'Pie chart' ? ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', color] : color,
          borderColor: color,
          fill: w.type === 'Area chart' ? 'origin' : false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: w.dataSettings.showLegend === false ? false : true,
            labels: { color: '#f5f5f0' }
          }
        },
        scales: w.type === 'Pie chart' ? {} : {
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a09a' } },
          x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a09a' } }
        }
      }
    });
  },

  async openWidgetModal(widgetId = null) {
    let widget = {
      title: 'Untitled', type: 'Table', description: '',
      width: 4, height: 4,
      dataSettings: { columns: [], chartData: 'Total amount', xAxis: 'Product', yAxis: 'Total amount', sortBy: 'Order date', pagination: 5, applyFilter: false, showLegend: true },
      styling: { fontSize: 14, headerBackground: '#54bd95', chartColor: '#c97d3c' }
    };

    if (widgetId) {
      widget = this.widgets.find(w => w._id === widgetId);
    }

    const types = ['Table', 'Pie chart', 'Bar chart', 'Line chart', 'Area chart', 'Scatter plot chart'];
    const columns = ['Customer ID', 'Customer name', 'Email id', 'Phone number', 'Address', 'Order ID', 'Order date', 'Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by'];
    const dataOptions = ['Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by', 'Duration'];
    const sortOptions = ['Ascending', 'Descending', 'Order date'];
    const pageOptions = [5, 10, 15];

    Components.openModal(widgetId ? 'Edit Widget' : 'Create New Widget', `
      <form id="widget-config-form">
        <h4 style="margin-bottom:12px;color:var(--copper-light)">Widget Core</h4>
        <div class="grid grid-12">
          <div class="col-6">
            <div class="input-group">
              <label>Widget title</label>
              <input class="input" id="w-title" value="${widget.title}" required>
            </div>
          </div>
          <div class="col-6">
            <div class="input-group">
              <label>Widget type</label>
              <select class="select" id="w-type" onchange="ChallengePage.toggleWidgetFields(this.value)">
                ${types.map(t => `<option value="${t}" ${widget.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="col-12">
            <div class="input-group">
              <label>Description (Optional)</label>
              <textarea class="textarea" id="w-description">${widget.description}</textarea>
            </div>
          </div>
        </div>

        <h4 style="margin:20px 0 12px;color:var(--copper-light)">Widget Size</h4>
        <div class="grid grid-12">
          <div class="col-6">
            <div class="input-group">
              <label>Width (Columns 1-12)</label>
              <input class="input" type="number" id="w-width" min="1" max="12" value="${widget.width}" required>
            </div>
          </div>
          <div class="col-6">
            <div class="input-group">
              <label>Height (Rows 1-8)</label>
              <input class="input" type="number" id="w-height" min="1" max="8" value="${widget.height}" required>
            </div>
          </div>
        </div>

        <div id="data-setting-section">
          <h4 style="margin:20px 0 12px;color:var(--copper-light)">Data Settings</h4>
          
          <div id="fields-table" style="display:${widget.type === 'Table' ? 'block' : 'none'}">
             <div class="input-group">
                <label>Choose columns</label>
                <div class="multiselect-container" id="w-columns">
                   ${columns.map(c => `
                     <div class="chip ${widget.dataSettings.columns?.includes(c) ? 'active' : ''}" onclick="this.classList.toggle('active')">${c}</div>
                   `).join('')}
                </div>
             </div>
             <div class="grid grid-12" style="margin-top:12px">
                <div class="col-4">
                   <div class="input-group">
                      <label>Sort by</label>
                      <select class="select" id="w-sortBy">
                         ${sortOptions.map(s => `<option value="${s}" ${widget.dataSettings.sortBy === s ? 'selected' : ''}>${s}</option>`).join('')}
                      </select>
                   </div>
                </div>
                <div class="col-4">
                   <div class="input-group">
                      <label>Pagination</label>
                      <select class="select" id="w-pagination">
                         ${pageOptions.map(p => `<option value="${p}" ${widget.dataSettings.pagination === p ? 'selected' : ''}>${p}</option>`).join('')}
                      </select>
                   </div>
                </div>
                <div class="col-4" style="display:flex;align-items:center">
                   <label class="filter-option" style="margin-top:16px">
                      <input type="checkbox" id="w-applyFilter" ${widget.dataSettings.applyFilter ? 'checked' : ''}> Apply filter
                   </label>
                </div>
             </div>
          </div>

          <div id="fields-pie" style="display:${widget.type === 'Pie chart' ? 'block' : 'none'}">
             <div class="grid grid-12">
                <div class="col-8">
                   <div class="input-group">
                      <label>Choose chart data</label>
                      <select class="select" id="w-chartData">
                         ${dataOptions.map(d => `<option value="${d}" ${widget.dataSettings.chartData === d ? 'selected' : ''}>${d}</option>`).join('')}
                      </select>
                   </div>
                </div>
                <div class="col-4" style="display:flex;align-items:center">
                   <label class="filter-option" style="margin-top:16px">
                      <input type="checkbox" id="w-showLegend" ${widget.dataSettings.showLegend ? 'checked' : ''}> Show legend
                   </label>
                </div>
             </div>
          </div>

          <div id="fields-charts" style="display:${['Bar chart', 'Line chart', 'Area chart', 'Scatter plot chart'].includes(widget.type) ? 'block' : 'none'}">
             <div class="grid grid-12">
                <div class="col-6">
                   <div class="input-group">
                      <label>Choose X-Axis data</label>
                      <select class="select" id="w-xAxis">
                         ${dataOptions.map(d => `<option value="${d}" ${widget.dataSettings.xAxis === d ? 'selected' : ''}>${d}</option>`).join('')}
                      </select>
                   </div>
                </div>
                <div class="col-6">
                   <div class="input-group">
                      <label>Choose Y-Axis data</label>
                      <select class="select" id="w-yAxis">
                         ${dataOptions.map(d => `<option value="${d}" ${widget.dataSettings.yAxis === d ? 'selected' : ''}>${d}</option>`).join('')}
                      </select>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <h4 style="margin:20px 0 12px;color:var(--copper-light)">Styling</h4>
        <div class="grid grid-12">
          <div id="style-table" class="col-12" style="display:${widget.type === 'Table' ? 'grid' : 'none'};grid-template-columns: repeat(2,1fr);gap:16px">
             <div class="input-group">
                <label>Font size</label>
                <input class="input" type="number" id="w-fontSize" value="${widget.styling.fontSize || 14}">
             </div>
             <div class="input-group">
                <label>Header background</label>
                <div style="display:flex;gap:10px">
                  <input class="input" type="color" id="w-headerBackground" value="${widget.styling.headerBackground || '#54bd95'}" style="width:50px;padding:2px">
                  <input class="input" type="text" value="${widget.styling.headerBackground || '#54bd95'}" oninput="document.getElementById('w-headerBackground').value = this.value">
                </div>
             </div>
          </div>
          <div id="style-charts" class="col-12" style="display:${widget.type !== 'Table' ? 'block' : 'none'}">
             <div class="input-group">
                <label>Chart/Color color</label>
                <div style="display:flex;gap:10px">
                   <input class="input" type="color" id="w-chartColor" value="${widget.styling.chartColor || '#c97d3c'}" style="width:50px;padding:2px">
                   <input class="input" type="text" value="${widget.styling.chartColor || '#c97d3c'}" oninput="document.getElementById('w-chartColor').value = this.value">
                </div>
             </div>
          </div>
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-widget">${widgetId ? 'Update Widget' : 'Save Widget'}</button>
    `, 'max-width:800px');

    document.getElementById('btn-save-widget').onclick = () => this.handleSaveWidget(widgetId);
  },

  toggleWidgetFields(type) {
    document.getElementById('fields-table').style.display = type === 'Table' ? 'block' : 'none';
    document.getElementById('fields-pie').style.display = type === 'Pie chart' ? 'block' : 'none';
    document.getElementById('fields-charts').style.display = ['Bar chart', 'Line chart', 'Area chart', 'Scatter plot chart'].includes(type) ? 'block' : 'none';
    
    document.getElementById('style-table').style.display = type === 'Table' ? 'grid' : 'none';
    document.getElementById('style-charts').style.display = type !== 'Table' ? 'block' : 'none';
  },

  async handleSaveWidget(id) {
    const data = {
      title: document.getElementById('w-title').value,
      type: document.getElementById('w-type').value,
      description: document.getElementById('w-description').value,
      width: parseInt(document.getElementById('w-width').value),
      height: parseInt(document.getElementById('w-height').value),
      dataSettings: {
        columns: Array.from(document.querySelectorAll('#w-columns .chip.active')).map(c => c.innerText),
        chartData: document.getElementById('w-chartData').value,
        xAxis: document.getElementById('w-xAxis').value,
        yAxis: document.getElementById('w-yAxis').value,
        sortBy: document.getElementById('w-sortBy').value,
        pagination: parseInt(document.getElementById('w-pagination').value),
        applyFilter: document.getElementById('w-applyFilter').checked,
        showLegend: document.getElementById('w-showLegend').checked
      },
      styling: {
        fontSize: parseInt(document.getElementById('w-fontSize').value),
        headerBackground: document.getElementById('w-headerBackground').value,
        chartColor: document.getElementById('w-chartColor').value
      }
    };

    try {
      if (id) {
        await API.updateWidget(id, data);
        Components.toast('Widget updated', 'success');
      } else {
        await API.createWidget(data);
        Components.toast('Widget created', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (err) { Components.toast(err.message, 'error'); }
  },

  async deleteWidget(id) {
    if (!confirm('Remove this widget from dashboard?')) return;
    try {
      await API.deleteWidget(id);
      Components.toast('Widget removed', 'success');
      this.render();
    } catch (err) { Components.toast(err.message, 'error'); }
  },

  // (Keeping Order Logic from previous version)
  async openOrderModal(orderId = null) {
      // Re-using the same modal content I wrote before...
      let order = {
        firstName: '', lastName: '', emailId: '', phoneNumber: '',
        streetAddress: '', city: '', stateProvince: '', postalCode: '',
        country: '', product: '', quantity: 1, unitPrice: 0, totalAmount: 0,
        status: 'Pending', createdBy: ''
      };

      if (orderId) {
        order = this.orders.find(o => o._id === orderId);
      }

      const products = ['Fiber Internet 300 Mbps', '5G Unlimited Mobile Plan', 'Fiber Internet 1 Gbps', 'Business Internet 500 Mbps', 'VoIP Corporate Package'];
      const countries = ['United States', 'Canada', 'Australia', 'Singapore', 'Hong Kong'];
      const statues = ['Pending', 'In progress', 'Completed'];
      const creators = ['Mr. Michael Harris', 'Mr. Ryan Cooper', 'Ms. Olivia Carter', 'Mr. Lucas Martin'];

      Components.openModal(orderId ? 'Edit Order' : 'Create New Order', `
        <form id="challenge-order-form">
          <div class="grid grid-12">
            <div class="col-6"><div class="input-group"><label>First name</label><input class="input" id="c-firstName" value="${order.firstName}"></div></div>
            <div class="col-6"><div class="input-group"><label>Last name</label><input class="input" id="c-lastName" value="${order.lastName}"></div></div>
            <div class="col-6"><div class="input-group"><label>Email</label><input class="input" id="c-emailId" value="${order.emailId}"></div></div>
            <div class="col-6"><div class="input-group"><label>Phone</label><input class="input" id="c-phoneNumber" value="${order.phoneNumber}"></div></div>
            <div class="col-12"><div class="input-group"><label>Address</label><input class="input" id="c-streetAddress" value="${order.streetAddress}"></div></div>
            <div class="col-4"><div class="input-group"><label>City</label><input class="input" id="c-city" value="${order.city}"></div></div>
            <div class="col-4"><div class="input-group"><label>State</label><input class="input" id="c-stateProvince" value="${order.stateProvince}"></div></div>
            <div class="col-4"><div class="input-group"><label>Zip</label><input class="input" id="c-postalCode" value="${order.postalCode}"></div></div>
            <div class="col-12"><div class="input-group"><label>Country</label><select class="select" id="c-country">${countries.map(c => `<option value="${c}" ${order.country === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
            
            <div class="col-12" style="margin-top:20px"><h4 style="color:var(--copper-light)">Order Details</h4></div>
            <div class="col-12"><div class="input-group"><label>Product</label><select class="select" id="c-product">${products.map(p => `<option value="${p}" ${order.product === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div></div>
            <div class="col-4"><div class="input-group"><label>Qty</label><input class="input" id="c-quantity" type="number" value="${order.quantity}" oninput="ChallengePage.calcOrderTotal()"></div></div>
            <div class="col-4"><div class="input-group"><label>Price ($)</label><input class="input" id="c-unitPrice" type="number" step="0.01" value="${order.unitPrice}" oninput="ChallengePage.calcOrderTotal()"></div></div>
            <div class="col-4"><div class="input-group"><label>Total</label><input class="input" id="c-totalAmount" value="${order.totalAmount.toFixed(2)}" readonly></div></div>
             <div class="col-6"><div class="input-group"><label>Status</label><select class="select" id="c-status">${statues.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
            <div class="col-6"><div class="input-group"><label>Created by</label><select class="select" id="c-createdBy">${creators.map(c => `<option value="${c}" ${order.createdBy === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
          </div>
        </form>
      `, `
        <button class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-order">${orderId ? 'Save' : 'Create'}</button>
      `, 'max-width:800px');

      document.getElementById('btn-save-order').onclick = () => this.handleSaveOrder(orderId);
  },

  calcOrderTotal() {
    const q = parseFloat(document.getElementById('c-quantity').value) || 0;
    const p = parseFloat(document.getElementById('c-unitPrice').value) || 0;
    document.getElementById('c-totalAmount').value = (q * p).toFixed(2);
  },

  async handleSaveOrder(id) {
    const fields = ['firstName', 'lastName', 'emailId', 'phoneNumber', 'streetAddress', 'city', 'stateProvince', 'postalCode', 'country', 'product', 'quantity', 'unitPrice', 'status', 'createdBy'];
    const data = {};
    fields.forEach(f => {
      const el = document.getElementById('c-'+f);
      data[f] = (f==='quantity' || f==='unitPrice') ? parseFloat(el.value) : el.value;
    });
    data.totalAmount = data.quantity * data.unitPrice;

    try {
      if (id) await API.updateChallengeOrder(id, data);
      else await API.createChallengeOrder(data);
      Components.closeModal();
      this.render();
      Components.toast('Order saved', 'success');
    } catch (err) { Components.toast(err.message, 'error'); }
  },

  async deleteOrder(id) {
    if (!confirm('Delete this order?')) return;
    try {
      await API.deleteChallengeOrder(id);
      Components.toast('Order deleted', 'success');
      this.render();
    } catch (err) { Components.toast(err.message, 'error'); }
  }
};
