const AnalyticsPage = {
  charts: {},
  activeChart: null, // null, 'revenue', 'orders', 'products', 'categories', 'status'
  selectedYear: new Date().getFullYear(),
  selectedMonth: null, // null = full year view

  async render() {
    if (!App.user || App.user.role !== 'admin') {
      document.getElementById('page-content').innerHTML = Components.emptyState('🔒', 'Admin access required', '<button class="btn btn-primary" onclick="window.router.navigate(\'/auth\')">Login as Admin</button>');
      return;
    }
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const [summary, monthly, topProducts, categorySales, orderStatus] = await Promise.all([
        API.request('/analytics/summary'),
        API.request(`/analytics/monthly?year=${this.selectedYear}`),
        API.request('/analytics/top-products'),
        API.request('/analytics/category-sales'),
        API.request('/analytics/order-status'),
      ]);
      this.renderDashboard(summary, monthly, topProducts, categorySales, orderStatus);
    } catch (err) {
      c.innerHTML = Components.emptyState('📊', 'Failed to load analytics. ' + err.message);
    }
  },

  renderDashboard(summary, monthly, topProducts, categorySales, orderStatus) {
    const c = document.getElementById('page-content');
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
      yearOptions.push(`<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y}</option>`);
    }
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthOptions = [`<option value="">Full Year</option>`];
    monthNames.forEach((m, i) => {
      monthOptions.push(`<option value="${i + 1}" ${this.selectedMonth === (i + 1) ? 'selected' : ''}>${m}</option>`);
    });

    c.innerHTML = `
      <div class="section-header">
        <h2>📊 Sales <span>Analytics</span></h2>
        <button class="btn btn-secondary btn-sm" style="color:var(--danger);border-color:var(--danger)" onclick="AnalyticsPage.resetData()">🗑 Reset Sales Data</button>
      </div>

      <div class="stats-row">
        <div class="stat-card fade-in-up"><div class="stat-value">${Components.formatPrice(summary.totalRevenue)}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-card fade-in-up" style="animation-delay:80ms"><div class="stat-value">${summary.totalOrders}</div><div class="stat-label">Total Orders</div></div>
        <div class="stat-card fade-in-up" style="animation-delay:160ms"><div class="stat-value">${Components.formatPrice(Math.round(summary.avgOrderValue))}</div><div class="stat-label">Avg Order Value</div></div>
        <div class="stat-card fade-in-up" style="animation-delay:240ms"><div class="stat-value">${summary.deliveredOrders}</div><div class="stat-label">Delivered</div></div>
      </div>

      <!-- Date Range Selector -->
      <div class="card fade-in-up" style="margin-bottom:24px;animation-delay:50ms">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <h3 style="margin-right:auto">📅 Filter Sales Data</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-size:0.8rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.03em">Year:</label>
            <select class="select" id="analytics-year" style="width:120px;padding:8px 28px 8px 12px">
              ${yearOptions.join('')}
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-size:0.8rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.03em">Month:</label>
            <select class="select" id="analytics-month" style="width:160px;padding:8px 28px 8px 12px">
              ${monthOptions.join('')}
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-apply-filter">Apply Filter</button>
          <div style="border-left:1px solid var(--border-subtle);height:30px;margin:0 10px"></div>
          <button class="btn btn-danger btn-sm" id="btn-reset-data">Reset Sales Data</button>
        </div>
      </div>

      <!-- Chart Selector Row -->
      <div style="margin-bottom:24px">
        <label style="display:block;font-size:0.75rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;margin-bottom:12px;letter-spacing:0.05em">Select Chart to View:</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn ${this.activeChart === 'revenue' ? 'btn-primary' : 'btn-secondary'} btn-sm chart-box-btn" data-chart="revenue">📈 Revenue Chart</button>
          <button class="btn ${this.activeChart === 'orders' ? 'btn-primary' : 'btn-secondary'} btn-sm chart-box-btn" data-chart="orders">📊 Orders Chart</button>
          <button class="btn ${this.activeChart === 'products' ? 'btn-primary' : 'btn-secondary'} btn-sm chart-box-btn" data-chart="products">🏆 Top Products</button>
          <button class="btn ${this.activeChart === 'categories' ? 'btn-primary' : 'btn-secondary'} btn-sm chart-box-btn" data-chart="categories">📁 Category Split</button>
          <button class="btn ${this.activeChart === 'status' ? 'btn-primary' : 'btn-secondary'} btn-sm chart-box-btn" data-chart="status">⚖️ Order Status</button>
          ${this.activeChart ? `<button class="btn btn-danger btn-sm" id="btn-clear-chart">✕ Clear</button>` : ''}
        </div>
      </div>

      <!-- Table First (List View) -->
      <div class="card fade-in-up" style="margin-bottom:24px; animation-delay: 100ms">
          <h3 style="margin-bottom:16px">${this.selectedMonth ? 'Daily Breakdown' : 'Monthly Breakdown'}</h3>
          <div style="max-height:400px;overflow-y:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr>
                <th style="text-align:left;padding:12px;font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle)">${this.selectedMonth ? 'Day' : 'Month'}</th>
                <th style="text-align:right;padding:12px;font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle)">Orders</th>
                <th style="text-align:right;padding:12px;font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle)">Items</th>
                <th style="text-align:right;padding:12px;font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle)">Revenue</th>
              </tr></thead>
              <tbody>
                ${monthly.map(m => `
                  <tr onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'" style="transition:background 0.2s">
                    <td style="padding:12px;font-size:0.95rem;border-bottom:1px solid var(--border-subtle);font-weight:600">${m.month || ('Day ' + m.day)}</td>
                    <td style="padding:12px;font-size:0.95rem;text-align:right;border-bottom:1px solid var(--border-subtle);color:var(--text-secondary)">${m.orders}</td>
                    <td style="padding:12px;font-size:0.95rem;text-align:right;border-bottom:1px solid var(--border-subtle);color:var(--text-secondary)">${m.items}</td>
                    <td style="padding:12px;font-size:0.95rem;text-align:right;border-bottom:1px solid var(--border-subtle);color:var(--copper-light);font-weight:700">${Components.formatPrice(m.revenue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
      </div>

      <div id="visual-charts-container">
        <!-- Revenue Chart -->
        ${this.activeChart === 'revenue' ? `
          <div class="card fade-in-up" style="padding:32px;margin-bottom:24px">
            <h3 style="margin-bottom:24px" id="chart-revenue-title">${this.selectedMonth ? `Daily Revenue — ${monthNames[this.selectedMonth - 1]} ${this.selectedYear}` : `Monthly Revenue (${this.selectedYear})`}</h3>
            <canvas id="chart-monthly-revenue" width="1200" height="500" style="width:100%"></canvas>
          </div>
        ` : ''}

        <!-- Orders Chart -->
        ${this.activeChart === 'orders' ? `
          <div class="card fade-in-up" style="padding:32px;margin-bottom:24px">
            <h3 style="margin-bottom:24px" id="chart-orders-title">${this.selectedMonth ? `Daily Orders — ${monthNames[this.selectedMonth - 1]} ${this.selectedYear}` : `Monthly Orders (${this.selectedYear})`}</h3>
            <canvas id="chart-monthly-orders" width="1200" height="500" style="width:100%"></canvas>
          </div>
        ` : ''}

        <!-- Top Products -->
        ${this.activeChart === 'products' ? `
          <div class="card fade-in-up" style="padding:32px;margin-bottom:24px">
            <h3 style="margin-bottom:24px">🏆 Top Selling Products</h3>
            <canvas id="chart-top-products" width="1200" height="500" style="width:100%"></canvas>
          </div>
        ` : ''}

        <!-- Categories -->
        ${this.activeChart === 'categories' ? `
          <div class="card fade-in-up" style="padding:32px;margin-bottom:24px">
            <h3 style="margin-bottom:24px">📁 Sales by Category</h3>
            <canvas id="chart-category-sales" width="1200" height="500" style="width:100%"></canvas>
          </div>
        ` : ''}

        <!-- Status -->
        ${this.activeChart === 'status' ? `
          <div class="card fade-in-up" style="padding:32px;margin-bottom:24px">
            <h3 style="margin-bottom:24px">⚖️ Order Status Distribution</h3>
            <canvas id="chart-order-status" width="1200" height="500" style="width:100%"></canvas>
          </div>
        ` : ''}
      </div>
    `;

    // Bind filter button
    document.getElementById('btn-apply-filter').addEventListener('click', () => {
      this.selectedYear = parseInt(document.getElementById('analytics-year').value);
      const monthVal = document.getElementById('analytics-month').value;
      this.selectedMonth = monthVal ? parseInt(monthVal) : null;
      this.loadFilteredData();
    });

    // Bind chart box buttons
    document.querySelectorAll('.chart-box-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeChart = e.target.closest('button').dataset.chart;
        this.renderDashboard(summary, monthly, topProducts, categorySales, orderStatus);
      });
    });

    // Bind clear chart button
    document.getElementById('btn-clear-chart')?.addEventListener('click', () => {
      this.activeChart = null;
      this.renderDashboard(summary, monthly, topProducts, categorySales, orderStatus);
    });

    // Render charts only if visible
    if (this.activeChart) {
      setTimeout(() => {
        const isMonthly = !this.selectedMonth;
        const labels = isMonthly ? monthly.map(m => m.month) : monthly.map(m => m.day);
        const ctxId = this.activeChart === 'revenue' ? 'chart-monthly-revenue' : 
                      this.activeChart === 'orders' ? 'chart-monthly-orders' : 
                      this.activeChart === 'products' ? 'chart-top-products' : 
                      this.activeChart === 'categories' ? 'chart-category-sales' : 
                      'chart-order-status';
        
        const canvas = document.getElementById(ctxId);
        if (!canvas) return;

        // Destroy previous chart if exists
        if (this.charts[ctxId]) this.charts[ctxId].destroy();

        if (this.activeChart === 'revenue') {
          this.charts[ctxId] = new Chart(canvas, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Revenue (₹)',
                data: monthly.map(m => m.revenue),
                backgroundColor: 'rgba(201, 125, 60, 0.6)',
                borderColor: '#c97d3c',
                borderWidth: 1,
                borderRadius: 4
              }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
          });
        } else if (this.activeChart === 'orders') {
          this.charts[ctxId] = new Chart(canvas, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Orders',
                data: monthly.map(m => m.orders),
                backgroundColor: 'rgba(49, 130, 206, 0.6)',
                borderColor: '#3182ce',
                borderWidth: 1,
                borderRadius: 4
              }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
          });
        } else if (this.activeChart === 'products') {
          this.charts[ctxId] = new Chart(canvas, {
            type: 'bar',
            data: {
              labels: topProducts.map(p => p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name),
              datasets: [{
                label: 'Revenue (₹)',
                data: topProducts.map(p => p.revenue),
                backgroundColor: 'rgba(232, 169, 100, 0.6)',
                borderColor: '#e8a964',
                borderWidth: 1
              }]
            },
            options: { indexAxis: 'y', responsive: true }
          });
        } else if (this.activeChart === 'categories') {
          this.charts[ctxId] = new Chart(canvas, {
            type: 'pie',
            data: {
              labels: categorySales.map(c => c.category),
              datasets: [{
                data: categorySales.map(c => c.revenue),
                backgroundColor: ['#c97d3c', '#3182ce', '#38a169', '#d69e2e', '#e53e3e']
              }]
            },
            options: { responsive: true }
          });
        } else if (this.activeChart === 'status') {
          this.charts[ctxId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
              labels: Object.keys(orderStatus),
              datasets: [{
                data: Object.values(orderStatus),
                backgroundColor: ['#f6ad55', '#4299e1', '#48bb78', '#f56565', '#a0aec0']
              }]
            },
            options: { responsive: true }
          });
        }
      }, 50);
    }
  },

  async resetSalesData() {
    if (!confirm('CRITICAL: Are you sure you want to clear ALL sales data? This will reset all totals and charts. This action cannot be undone.')) return;
    
    // Require OTP for security
    try {
      const phone = App.user.phone || '9080799320';
      const res = await API.sendOTP(phone);
      if (res.mock) Components.toast(res.message, 'info');
      
      Components.openModal('Reset Data Verification', `
        <div style="text-align:center;padding:10px">
          <div style="font-size:2rem;margin-bottom:12px">👮‍♂️ Admin Action</div>
          <p style="margin-bottom:20px;font-size:0.9rem">To clear all sales data, please enter the OTP sent to <strong>${phone}</strong>.</p>
          <input type="text" id="reset-otp" class="input" maxlength="4" placeholder="••••" style="width:140px;text-align:center;font-size:1.5rem;letter-spacing:0.5em;margin-bottom:16px">
          <div id="reset-otp-error" style="color:var(--danger);font-size:0.8rem;margin-top:4px;display:none"></div>
        </div>
      `, `
        <button class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="btn-confirm-reset">Reset Everything</button>
      `);

      document.getElementById('btn-confirm-reset').addEventListener('click', async () => {
        const code = document.getElementById('reset-otp').value.trim();
        const errEl = document.getElementById('reset-otp-error');
        if (code.length !== 4) {
          errEl.textContent = 'Enter 4-digit code';
          errEl.style.display = 'block';
          return;
        }

        try {
          const btnSave = document.getElementById('btn-confirm-reset');
          btnSave.disabled = true;
          btnSave.textContent = 'Verifying...';

          await API.verifyOTP(phone, code);
          
          // VERIFIED - Delete all orders
          await API.request('/orders/all', { method: 'DELETE' });
          
          Components.closeModal();
          Components.toast('Sales data cleared successfully', 'success');
          this.render(); // Refresh page
        } catch (err) {
          errEl.textContent = 'Invalid OTP code. Try again.';
          errEl.style.display = 'block';
          btnSave.disabled = false;
          btnSave.textContent = 'Reset Everything';
        }
      });
    } catch (err) {
      Components.toast(err.message, 'error');
    }
  },

  async loadFilteredData() {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      let chartData;
      if (this.selectedMonth) {
        chartData = await API.request(`/analytics/daily?year=${this.selectedYear}&month=${this.selectedMonth}`);
      } else {
        chartData = await API.request(`/analytics/monthly?year=${this.selectedYear}`);
      }
      const [summary, topProducts, categorySales, orderStatus] = await Promise.all([
        API.request('/analytics/summary'),
        API.request('/analytics/top-products'),
        API.request('/analytics/category-sales'),
        API.request('/analytics/order-status'),
      ]);
      this.renderDashboard(summary, chartData, topProducts, categorySales, orderStatus);
    } catch (err) {
      c.innerHTML = Components.emptyState('📊', 'Failed to load analytics. ' + err.message);
    }
  },

  // ========== CANVAS CHART FUNCTIONS ==========

  drawBarChart(canvasId, labels, values, label, color, isCurrency) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = 640;
    ctx.scale(1, 1);

    const pad = { top: 30, right: 20, bottom: 60, left: isCurrency ? 80 : 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...values, 1);
    const barW = chartW / labels.length * 0.6;
    const gap = chartW / labels.length * 0.4;

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#5a5a55';
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + chartH - (chartH / gridLines * i);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      const val = Math.round(maxVal / gridLines * i);
      ctx.textAlign = 'right';
      ctx.fillText(isCurrency ? '₹' + val.toLocaleString('en-IN') : val, pad.left - 8, y + 5);
    }

    // Bars
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '33');

    labels.forEach((lbl, i) => {
      const x = pad.left + (chartW / labels.length) * i + gap / 2;
      const barH = (values[i] / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const r = Math.min(8, barW / 2);
      ctx.moveTo(x, y + r);
      ctx.arcTo(x, y, x + barW, y, r);
      ctx.arcTo(x + barW, y, x + barW, y + barH, r);
      ctx.lineTo(x + barW, pad.top + chartH);
      ctx.lineTo(x, pad.top + chartH);
      ctx.closePath();
      ctx.fill();

      // Value on top
      ctx.fillStyle = '#f5f5f0';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      if (values[i] > 0) {
        ctx.fillText(isCurrency ? '₹' + values[i].toLocaleString('en-IN') : values[i], x + barW / 2, y - 8);
      }

      // Label
      ctx.fillStyle = '#a0a09a';
      ctx.font = labels.length > 20 ? '12px Inter, sans-serif' : '18px Inter, sans-serif';
      ctx.fillText(lbl, x + barW / 2, pad.top + chartH + 28);
    });
  },

  drawHorizontalBarChart(canvasId, labels, values, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = 640;

    const pad = { top: 10, right: 100, bottom: 20, left: 200 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...values, 1);
    const barH = Math.min(40, chartH / labels.length * 0.7);
    const slotH = chartH / Math.max(labels.length, 1);

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, W, H);

    labels.forEach((lbl, i) => {
      const y = pad.top + slotH * i + (slotH - barH) / 2;
      const barW = (values[i] / maxVal) * chartW;

      const gradient = ctx.createLinearGradient(pad.left, 0, pad.left + barW, 0);
      gradient.addColorStop(0, color + '44');
      gradient.addColorStop(1, color);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      const r = Math.min(6, barH / 2);
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + barW - r, y);
      ctx.arcTo(pad.left + barW, y, pad.left + barW, y + barH, r);
      ctx.arcTo(pad.left + barW, y + barH, pad.left, y + barH, r);
      ctx.lineTo(pad.left, y + barH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a0a09a';
      ctx.font = '18px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(lbl, pad.left - 12, y + barH / 2 + 6);

      ctx.fillStyle = '#f5f5f0';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('₹' + values[i].toLocaleString('en-IN'), pad.left + barW + 10, y + barH / 2 + 6);
    });
  },

  drawPieChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = 640;

    const colors = ['#c97d3c', '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20', '#319795'];
    const total = values.reduce((s, v) => s + v, 0) || 1;
    const cx = W / 2 - 100;
    const cy = H / 2;
    const radius = Math.min(cx, cy) - 40;

    let startAngle = -Math.PI / 2;
    labels.forEach((lbl, i) => {
      const sliceAngle = (values[i] / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#0d0d0d';
      ctx.lineWidth = 3;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    let ly = 40;
    ctx.textAlign = 'left';
    labels.forEach((lbl, i) => {
      const pct = Math.round((values[i] / total) * 100);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(W - 280, ly, 16, 16);
      ctx.fillStyle = '#a0a09a';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`${lbl} (${pct}%)`, W - 256, ly + 13);
      ly += 30;
    });
  },

  drawDonutChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = 640;

    const statusColors = { pending: '#d69e2e', confirmed: '#3182ce', shipped: '#c97d3c', delivered: '#38a169', cancelled: '#e53e3e' };
    const total = values.reduce((s, v) => s + v, 0) || 1;
    const cx = W / 2 - 100;
    const cy = H / 2;
    const outerR = Math.min(cx, cy) - 40;
    const innerR = outerR * 0.55;

    let startAngle = -Math.PI / 2;
    labels.forEach((lbl, i) => {
      const sliceAngle = (values[i] / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = statusColors[lbl] || '#718096';
      ctx.fill();
      ctx.strokeStyle = '#0d0d0d';
      ctx.lineWidth = 3;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    ctx.fillStyle = '#f5f5f0';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 8);
    ctx.fillStyle = '#5a5a55';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('Total Orders', cx, cy + 36);

    let ly = 40;
    ctx.textAlign = 'left';
    labels.forEach((lbl, i) => {
      ctx.fillStyle = statusColors[lbl] || '#718096';
      ctx.fillRect(W - 260, ly, 16, 16);
      ctx.fillStyle = '#a0a09a';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`${lbl}: ${values[i]}`, W - 236, ly + 13);
      ly += 30;
    });
  },

  async resetData() {
    if (!confirm('⚠️ CRITICAL ACTION: This will permanently delete ALL order records and sales history. Are you absolutely sure?')) return;
    try {
      await API.request('/orders/all', { method: 'DELETE' });
      Components.toast('All sales data has been cleared', 'success');
      this.render();
    } catch (err) { Components.toast(err.message, 'error'); }
  },
};
