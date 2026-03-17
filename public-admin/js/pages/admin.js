const AdminPage = {
  async render() {
    if (!App.user || App.user.role !== 'admin') {
      document.getElementById('page-content').innerHTML = Components.emptyState('🔒', 'Admin access required', '<button class="btn btn-primary" onclick="window.router.navigate(\'/auth\')">Login as Admin</button>');
      return;
    }
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const [prodData, orderData, catData] = await Promise.all([
        API.getProducts({ limit: 100 }),
        API.getOrders({ limit: 100 }),
        API.getCategories(),
      ]);
      this.renderDashboard(prodData, orderData, catData);
    } catch (err) { c.innerHTML = Components.emptyState('⚠️', 'Failed to load dashboard'); }
  },

  renderDashboard(prodData, orderData, catData) {
    const c = document.getElementById('page-content');
    const products = prodData.products;
    const orders = orderData.orders;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

    c.innerHTML = `
      <div class="section-header"><h2>🎛️ Admin <span>Dashboard</span></h2></div>

      <div class="stats-row" style="margin-bottom:24px">
        <div class="stat-card fade-in-up"><div class="stat-value">${products.length}</div><div class="stat-label">Products</div></div>
        <div class="stat-card fade-in-up" style="animation-delay:100ms"><div class="stat-value">${orders.length}</div><div class="stat-label">Orders</div></div>
        <div class="stat-card fade-in-up" style="animation-delay:200ms"><div class="stat-value">${Components.formatPrice(totalRevenue)}</div><div class="stat-label">Revenue</div></div>
        <div class="stat-card fade-in-up" style="animation-delay:300ms"><div class="stat-value">${catData.length}</div><div class="stat-label">Categories</div></div>
      </div>

      ${(() => {
        const criticalItems = products.filter(p => p.stock <= 1);
        if (criticalItems.length === 0) return '';
        return `
          <div class="card fade-in-up" style="background:linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(201,125,60,0.05) 100%);border-color:rgba(239,68,68,0.3);margin-bottom:24px;box-shadow:0 8px 32px rgba(239,68,68,0.15)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <span style="font-size:1.5rem">🚨</span>
              <h3 style="color:var(--danger)">Critical Stock Alerts</h3>
              <div class="badge badge-cancelled" style="margin-left:auto">${criticalItems.length} Items</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:16px">
              ${criticalItems.map(p => `
                <div style="background:var(--bg-card);border:1px solid ${p.stock === 0 ? 'var(--danger)' : 'var(--warning)'};padding:12px;border-radius:var(--radius-sm);display:flex;flex-direction:column;gap:8px">
                  <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Components.escapeHtml(p.name)}</div>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:0.8rem;color:var(--text-muted)">SKU: ${p.sku || 'N/A'}</span>
                    <strong style="color:${p.stock === 0 ? 'var(--danger)' : 'var(--warning)'}">${p.stock === 0 ? 'Out of Stock' : '1 Remaining'}</strong>
                  </div>
                  <button class="btn btn-primary btn-sm" style="width:100%;margin-top:4px;${p.stock === 0 ? 'background:var(--danger)' : ''}" onclick="window.router.navigate('/inventory')">Manage Stock</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>Recent Orders</h3>
          </div>
          ${orders.length ? `
            <div class="table-container" style="border:none">
              <table>
                <thead><tr><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  ${orders.slice(0, 10).map(o => `
                    <tr>
                      <td>
                        <div style="font-weight:700;color:var(--text-primary)">${Components.escapeHtml(o.shopName || o.customerName)}</div>
                        <div style="font-size:0.7rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">
                           ${Components.escapeHtml(o.city || '—')} · ${Components.escapeHtml(o.customerPhone || '—')}
                        </div>
                      </td>
                      <td style="color:var(--copper-light);font-weight:700">${Components.formatPrice(o.total)}</td>
                      <td>${Components.statusBadge(o.status)}</td>
                      <td style="display:flex;gap:8px;align-items:center">
                        <select class="select" style="width:auto;padding:4px 28px 4px 8px;font-size:0.75rem" onchange="AdminPage.updateOrderStatus('${o.id}', this.value)">
                          ${(() => {
                            const statusOptions = ['Order Received', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
                              .map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`)
                              .join('');
                            return statusOptions;
                          })()}
                        </select>
                        <button class="btn btn-ghost btn-sm" onclick="OrdersPage.viewDetails('${o.id}')" title="View Details">👁️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="color:var(--text-muted);text-align:center;padding:16px">No orders yet</p>'}
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>Products</h3>
            <button class="btn btn-primary btn-sm" onclick="AdminPage.showProductModal()">＋ Add Product</button>
          </div>
          <div style="max-height:400px;overflow-y:auto">
            ${products.slice(0, 15).map(p => `
              <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                <span>${Components.productIcon(p.category?p.category.name:'')}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Components.escapeHtml(p.name)}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted)">${Components.formatPrice(p.price)} · ${p.stock} stock</div>
                </div>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.showProductModal('${p.id}')">✏️</button>
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.deleteProduct('${p.id}')">🗑</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async updateOrderStatus(id, status) {
    try { await API.updateOrder(id, { status }); Components.toast(`Order ${status}`, 'success'); } catch (err) { Components.toast(err.message, 'error'); }
  },

  async deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try { await API.deleteProduct(id); Components.toast('Product deleted', 'success'); this.render(); } catch (err) { Components.toast(err.message, 'error'); }
  },

  async showProductModal(id = null) {
    const isEdit = !!id;
    let product = { name: '', categoryId: '', price: '', stock: 0, description: '', images: [] };
    
    const [cats, singleProd] = await Promise.all([
      API.getCategories(),
      isEdit ? API.getProduct(id) : Promise.resolve(null)
    ]);
    
    if (isEdit && singleProd) product = singleProd;
    if (!product.images) product.images = [];

    const renderImagesList = () => {
      const list = document.getElementById('ap-images-list');
      if (!list) return;
      list.innerHTML = product.images.map((img, i) => `
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input class="input ap-image-input" value="${Components.escapeHtml(img)}" placeholder="Image URL ${i+1}" style="flex:1">
          <button class="btn btn-ghost btn-sm" onclick="AdminPage.removeImage(${i})">✕</button>
        </div>
      `).join('');
    };

    // Store temporarily on the Page object for the helper functions
    this._currentModalProduct = product;

    Components.openModal(isEdit ? 'Edit Product' : 'Add Product', `
      <div class="input-group"><label>Name</label><input class="input" id="ap-name" value="${Components.escapeHtml(product.name)}" placeholder="Product name"></div>
      <div class="input-group"><label>Category</label><select class="select" id="ap-category">${cats.map(c=>`<option value="${c.id}" ${c.id===product.categoryId?'selected':''}>${c.name}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="input-group"><label>Price (₹)</label><input class="input" id="ap-price" type="number" value="${product.price}" placeholder="0"></div>
        <div class="input-group"><label>Stock</label><input class="input" id="ap-stock" type="number" value="${product.stock}" placeholder="0"></div>
      </div>
      <div class="input-group"><label>Gallary Images (URLs)</label>
        <div id="ap-images-list"></div>
        <button class="btn btn-secondary btn-sm" id="btn-add-image" style="width:100%;margin-top:4px">＋ Add Image URL</button>
      </div>
      <div class="input-group" style="margin-top:20px;padding:16px;background:var(--bg-tertiary);border-radius:12px;border:1px dashed var(--border-subtle)">
        <label style="color:var(--copper-light);font-weight:700">📤 Upload New Image</label>
        <input type="file" id="ap-image-file" class="input" accept="image/*" style="margin-top:8px;padding:8px">
        <p style="font-size:0.7rem;color:var(--text-muted);margin-top:8px">Choosing a file will upload it to Cloudinary and set it as the main product image.</p>
      </div>
      <div class="input-group"><label>Description</label><textarea class="textarea" id="ap-desc" placeholder="Product description">${Components.escapeHtml(product.description)}</textarea></div>
    `, `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-product">${isEdit ? 'Update Details' : 'Create Product'}</button>
    `);

    renderImagesList();

    document.getElementById('btn-add-image').addEventListener('click', () => {
      // Sync current inputs back to product.images before adding
      product.images = Array.from(document.querySelectorAll('.ap-image-input')).map(input => input.value.trim());
      product.images.push('');
      renderImagesList();
    });

    // Handle image removal (global helper)
    AdminPage.removeImage = (index) => {
      product.images = Array.from(document.querySelectorAll('.ap-image-input')).map(input => input.value.trim());
      product.images.splice(index, 1);
      renderImagesList();
    };

    document.getElementById('btn-save-product').addEventListener('click', async () => {
      const formData = new FormData();
      formData.append('name', document.getElementById('ap-name').value.trim());
      formData.append('categoryId', document.getElementById('ap-category').value);
      formData.append('price', parseFloat(document.getElementById('ap-price').value));
      formData.append('stock', parseInt(document.getElementById('ap-stock').value));
      formData.append('description', document.getElementById('ap-desc').value.trim());
      
      const images = Array.from(document.querySelectorAll('.ap-image-input'))
        .map(input => input.value.trim())
        .filter(url => url !== '');
      formData.append('images', JSON.stringify(images));

      const fileInput = document.getElementById('ap-image-file');
      if (fileInput.files[0]) {
        formData.append('imageFile', fileInput.files[0]);
      }

      if (!document.getElementById('ap-name').value.trim() || isNaN(parseFloat(document.getElementById('ap-price').value))) { 
        Components.toast('Name and price required', 'error'); 
        return; 
      }
      
      try {
        const btn = document.getElementById('btn-save-product');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        if (isEdit) {
          await API.request(`/products/${id}`, { method: 'PUT', body: formData });
          Components.toast('Product updated!', 'success');
        } else {
          await API.request('/products', { method: 'POST', body: formData });
          Components.toast('Product added!', 'success');
        }
        Components.closeModal();
        this.render();
      } catch (err) { Components.toast(err.message, 'error'); }
    });
  },
};
