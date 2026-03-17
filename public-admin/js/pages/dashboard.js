const DashboardPage = {
  widgets: [],
  isConfigMode: false,
  selectedRange: 'all', // 'all', 'today', '7', '30', '90'

  async render() {
    if (!App.user || App.user.role !== 'admin') {
      document.getElementById('page-content').innerHTML = Components.emptyState('🔒', 'Admin access required', '<button class="btn btn-primary" onclick="window.router.navigate(\'/auth\')">Login as Admin</button>');
      return;
    }
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const data = await API.getWidgets();
      this.widgets = data.widgets || [];
      this.renderView();
    } catch (err) { c.innerHTML = Components.emptyState('⚠️', 'Failed to load dashboard widgets'); }
  },

  renderView() {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="section-header">
        <h2>📈 Custom <span>Dashboard</span></h2>
        <div style="display:flex;gap:12px;align-items:center">
          <div class="input-group" style="margin:0; width:180px">
            <select class="select" id="dash-date-filter" onchange="DashboardPage.handleDateChange(this.value)">
              <option value="all" ${this.selectedRange==='all'?'selected':''}>All Time</option>
              <option value="today" ${this.selectedRange==='today'?'selected':''}>Today</option>
              <option value="7" ${this.selectedRange==='7'?'selected':''}>Last 7 Days</option>
              <option value="30" ${this.selectedRange==='30'?'selected':''}>Last 30 Days</option>
              <option value="90" ${this.selectedRange==='90'?'selected':''}>Last 90 Days</option>
            </select>
          </div>
          <button class="btn ${this.isConfigMode ? 'btn-success' : 'btn-primary'}" onclick="DashboardPage.toggleConfig()">
            ${this.isConfigMode ? '✅ Finish Configuration' : '⚙️ Configure Dashboard'}
          </button>
        </div>
      </div>

      <div class="dashboard-layout ${this.isConfigMode ? 'config-active' : ''}" style="display:flex;gap:24px">
        ${this.isConfigMode ? this.renderSidebar() : ''}
        <div class="widget-grid" id="widget-grid" style="flex:1">
          ${this.widgets.length === 0 ? `
            <div style="grid-column: 1 / -1; padding: 100px; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border: 2px dashed var(--border-subtle); border-radius: 16px">
              <div style="font-size: 3rem; margin-bottom: 16px">📉</div>
              <h3>No widgets configured</h3>
              <p>Click "Configure Dashboard" to start building your personalized view.</p>
            </div>
          ` : this.widgets.sort((a,b)=>a.position-b.position).map(w => this.renderWidget(w)).join('')}
        </div>
      </div>
    `;

    // Initialize charts and KPIs after rendering the grid
    if (this.widgets.length > 0) {
        this.initAllWidgets();
    }

    if (this.isConfigMode) this.initDragDrop();
  },

  renderSidebar() {
    return `
      <div class="card" style="width:280px; position: sticky; top: 100px; height: calc(100vh - 120px); overflow-y: auto">
        <h3 style="margin-bottom:16px; font-size:1rem">Available Widgets</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:20px">Drag widgets to the grid or click to add.</p>
        
        <div class="widget-toolbox">
          <div class="toolbox-section">
            <span class="toolbox-label">> Charts</span>
            <div class="toolbox-items">
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('Bar chart')">📊 Bar Chart</div>
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('Line chart')">📈 Line Chart</div>
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('Pie chart')">🍕 Pie Chart</div>
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('Area chart')">🌊 Area Chart</div>
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('Scatter plot chart')">✨ Scatter Plot</div>
            </div>
          </div>
          <div class="toolbox-section" style="margin-top:16px">
            <span class="toolbox-label">> Tables</span>
            <div class="toolbox-items">
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('Table')">📋 Table</div>
            </div>
          </div>
          <div class="toolbox-section" style="margin-top:16px">
            <span class="toolbox-label">> KPIs</span>
            <div class="toolbox-items">
              <div class="toolbox-item" onclick="DashboardPage.showWidgetModal('KPI')">⭐ KPI Value</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderWidget(w) {
    return `
      <div class="widget-card" style="--width: ${w.width}; --height: ${w.height}" data-id="${w.id}">
        <div class="widget-header" style="background: ${w.styling?.headerBackground || 'var(--border-subtle)'}">
          <span class="widget-title">${Components.escapeHtml(w.title)}</span>
          ${this.isConfigMode ? `
            <div class="widget-actions">
              <button onclick="DashboardPage.showWidgetModal('${w.type}', '${w.id}')">✏️</button>
              <button onclick="DashboardPage.deleteWidget('${w.id}')">🗑️</button>
            </div>
          ` : ''}
        </div>
        <div class="widget-content" id="widget-body-${w.id}">
          ${this.renderWidgetPreview(w)}
        </div>
      </div>
    `;
  },

  renderWidgetPreview(w) {
    if (w.type === 'KPI') {
      return `
        <div class="kpi-widget" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px">
          <div class="kpi-value" style="font-size:3rem; font-weight:800; color:var(--copper-light)">Loading...</div>
          <div class="kpi-label" style="text-transform:uppercase; font-size:0.8rem; letter-spacing:1px; color:var(--text-muted)">${Components.escapeHtml(w.title)}</div>
        </div>
      `;
    }
    if (w.type === 'Table') {
      return `<div class="table-container" style="padding:10px"><table style="font-size:${w.styling?.fontSize || 14}px"><thead><tr>${(w.dataSettings?.columns || ['Loading']).map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody><tr><td colspan="10" style="text-align:center; padding:20px">Loading data...</td></tr></tbody></table></div>`;
    }
    return `<canvas id="canvas-${w.id}" style="padding:15px"></canvas>`;
  },

  async initKPI(w, orders) {
    const container = document.getElementById(`widget-body-${w.id}`);
    if (!container) return;

    const filtered = this.applyDateFilter(orders);
    
    let value = 0;
    let label = w.title;
    let prefix = '';

    if (w.title.toLowerCase().includes('revenue')) {
      value = filtered.reduce((s, o) => s + o.total, 0);
      prefix = '₹';
    } else if (w.title.toLowerCase().includes('order')) {
      value = filtered.length;
    } else if (w.title.toLowerCase().includes('average')) {
      const total = filtered.reduce((s, o) => s + o.total, 0);
      value = filtered.length ? Math.round(total / filtered.length) : 0;
      prefix = '₹';
    } else if (w.title.toLowerCase().includes('customer')) {
      value = new Set(filtered.map(o => o.customerPhone)).size;
    }

    container.innerHTML = `
      <div class="kpi-widget" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center">
        <div class="kpi-value" style="font-size:3.5rem; font-weight:900; line-height:1">${prefix}${value.toLocaleString()}</div>
        <div class="kpi-label" style="text-transform:uppercase; font-size:0.75rem; letter-spacing:2px; color:var(--text-secondary); margin-top:12px; font-weight:700">${Components.escapeHtml(label)}</div>
      </div>
    `;
  },

  async initChart(w, orders) {
    const ctx = document.getElementById(`canvas-${w.id}`)?.getContext('2d');
    if (!ctx) return;

    const filteredOrders = this.applyDateFilter(orders);
    
    let chartData = { labels: [], datasets: [] };
    const chartType = w.type.toLowerCase().split(' ')[0]; // 'bar', 'line', etc

    if (w.type === 'Pie chart') {
      // Group by Status or Category
      const groups = {};
      filteredOrders.forEach(o => {
        const key = o.status || 'Pending';
        groups[key] = (groups[key] || 0) + o.total;
      });
      chartData = {
        labels: Object.keys(groups),
        datasets: [{
          data: Object.values(groups),
          backgroundColor: ['#c97d3c', '#54bd95', '#3182ce', '#d69e2e', '#e53e3e', '#718096']
        }]
      };
    } else {
      // For Bar, Line, Area - group by Date
      const timeline = {};
      filteredOrders.slice().reverse().forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        timeline[date] = (timeline[date] || 0) + o.total;
      });
      chartData = {
        labels: Object.keys(timeline),
        datasets: [{
          label: 'Revenue (₹)',
          data: Object.values(timeline),
          borderColor: w.styling?.chartColor || '#c97d3c',
          backgroundColor: w.type === 'Area chart' ? (w.styling?.chartColor + '33' || '#c97d3c33') : (w.styling?.chartColor || '#c97d3c'),
          fill: w.type === 'Area chart',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      };
    }

    if (this.charts[w.id]) this.charts[w.id].destroy();
    
    this.charts[w.id] = new Chart(ctx, {
      type: chartType === 'area' ? 'line' : (chartType === 'scatter' ? 'scatter' : chartType),
      data: chartData,
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: w.dataSettings?.showLegend ?? true,
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 10 } }
          } 
        },
        scales: chartType === 'pie' ? {} : {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  },

  charts: {},

  async initAllWidgets() {
    try {
      const { orders } = await API.getOrders({ limit: 1000 });
    const ordersData = orders ? orders.filter(o => o) : [];
    this.widgets.forEach(w => {
      if (!w) return;
      if (w.type === 'KPI') this.initKPI(w, ordersData);
      else if (w.type.includes('chart')) this.initChart(w, ordersData);
      else if (w.type === 'Table') this.initTable(w, ordersData);
    });
    } catch (err) { console.error('Dashboard Data Load Error:', err); }
  },

  async initTable(w, orders) {
    const container = document.getElementById(`widget-body-${w.id}`);
    if (!container) return;

    const filtered = this.applyDateFilter(orders);
    const cols = w.dataSettings?.columns?.length ? w.dataSettings.columns : ['Date', 'Customer', 'Total', 'Status'];

    container.innerHTML = `
      <div class="table-container" style="padding:10px; height:100%; overflow-y:auto">
        <table style="font-size:${w.styling?.fontSize || 14}px">
          <thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
          <tbody>
            ${filtered.slice(0, 10).map(o => `
              <tr>
                ${cols.map(c => {
                  if (c.toLowerCase().includes('date')) return `<td>${new Date(o.createdAt).toLocaleDateString()}</td>`;
                  if (c.toLowerCase().includes('customer')) return `<td>${Components.escapeHtml(o.shopName || o.customerName)}</td>`;
                  if (c.toLowerCase().includes('total')) return `<td style="font-weight:700">${Components.formatPrice(o.total)}</td>`;
                  if (c.toLowerCase().includes('status')) return `<td>${Components.statusBadge(o.status)}</td>`;
                  return '<td>—</td>';
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  applyDateFilter(orders) {
    if (this.selectedRange === 'all') return orders;
    const now = new Date();
    const limit = new Date();
    if (this.selectedRange === 'today') limit.setHours(0,0,0,0);
    else limit.setDate(now.getDate() - parseInt(this.selectedRange));
    
    return orders.filter(o => new Date(o.createdAt) >= limit);
  },

  handleDateChange(val) {
    this.selectedRange = val;
    this.renderView();
  },

  toggleConfig() {
    this.isConfigMode = !this.isConfigMode;
    this.renderView();
  },

  async showWidgetModal(type, id = null) {
    const isEdit = !!id;
    let widget = this.widgets.find(w => w.id === id) || { 
      title: '', type, width: 4, height: 4, 
      dataSettings: { columns: [], showLegend: true },
      styling: { headerBackground: '#54bd95', chartColor: '#c97d3c' }
    };

    Components.openModal(isEdit ? 'Edit Widget' : 'Configure New Widget', `
      <form id="widget-config-form">
        <div class="input-group">
          <label>Widget Title*</label>
          <input class="input" id="w-title" value="${Components.escapeHtml(widget.title)}" placeholder="Untitled">
          <span class="error-msg" id="err-title" style="display:none; color:var(--danger); font-size:0.75rem; margin-top:4px">Please fill the field</span>
        </div>
        <div class="input-group">
          <label>Widget Type</label>
          <input class="input" value="${type}" readonly style="background:var(--bg-tertiary)">
        </div>
        <div class="input-group">
          <label>Description</label>
          <textarea class="textarea" id="w-desc" placeholder="Optional notes...">${Components.escapeHtml(widget.description || '')}</textarea>
        </div>
        
        <h4 style="margin:20px 0 10px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px">Widget Size</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
          <div class="input-group">
            <label>Width (Columns 1-12)*</label>
            <input type="number" class="input" id="w-width" value="${widget.width}" min="1" max="12">
            <span class="error-msg" id="err-width" style="display:none; color:var(--danger); font-size:0.75rem; margin-top:4px">Please fill the field</span>
          </div>
          <div class="input-group">
            <label>Height (Rows)*</label>
            <input type="number" class="input" id="w-height" value="${widget.height}" min="1" max="12">
            <span class="error-msg" id="err-height" style="display:none; color:var(--danger); font-size:0.75rem; margin-top:4px">Please fill the field</span>
          </div>
        </div>

        <h4 style="margin:20px 0 10px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px">Styling</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
          <div class="input-group">
            <label>Header Color</label>
            <input type="color" class="input" id="w-header-bg" value="${widget.styling?.headerBackground || '#54bd95'}" style="height:44px; padding:2px">
          </div>
          <div class="input-group">
            <label>Chart/Primary Color</label>
            <input type="color" class="input" id="w-chart-color" value="${widget.styling?.chartColor || '#c97d3c'}" style="height:44px; padding:2px">
          </div>
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-widget">Submit</button>
    `);

    document.getElementById('btn-save-widget').onclick = async () => {
      const title = document.getElementById('w-title').value.trim();
      const width = parseInt(document.getElementById('w-width').value);
      const height = parseInt(document.getElementById('w-height').value);
      const description = document.getElementById('w-desc').value.trim();
      const headerBackground = document.getElementById('w-header-bg').value;
      const chartColor = document.getElementById('w-chart-color').value;

      // Validation
      let hasError = false;
      ['title', 'width', 'height'].forEach(f => {
        const val = document.getElementById(`w-${f}`).value.trim();
        const err = document.getElementById(`err-${f}`);
        if (!val) { err.style.display = 'block'; hasError = true; }
        else { err.style.display = 'none'; }
      });

      if (hasError) return;

      const payload = {
        title, type, width, height, description,
        styling: { headerBackground, chartColor },
        position: isEdit ? widget.position : this.widgets.length
      };

      try {
        if (isEdit) await API.updateWidget(id, payload);
        else await API.createWidget(payload);
        
        Components.toast('Widget saved!', 'success');
        Components.closeModal();
        this.render();
      } catch (err) { Components.toast(err.message, 'error'); }
    };
  },

  async deleteWidget(id) {
    if (!confirm('Warning: This will remove the widget from the dashboard. Continue?')) return;
    try {
      await API.deleteWidget(id);
      this.widgets = this.widgets.filter(w => w.id !== id);
      this.renderView();
    } catch (err) { Components.toast(err.message, 'error'); }
  },

  initDragDrop() {
    // Basic drag-and-drop placeholder: in a real app, use Lib like Sortable.js
    // For now, let's just make items clickable to reorder in the list
    console.log('Drag-and-drop mode active');
  }
};
