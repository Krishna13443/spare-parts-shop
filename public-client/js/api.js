const API = {
  base: '/api',
  token: localStorage.getItem('token') || null,

  async request(path, options = {}) {
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    if (this.token) config.headers['Authorization'] = `Bearer ${this.token}`;
    if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
    const res = await fetch(`${this.base}${path}`, config);
    if (res.status === 401) {
      this.clearToken();
      localStorage.removeItem('user');
      if (typeof App !== 'undefined' && App.syncUser) App.syncUser();
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  },

  setToken(t) { this.token = t; localStorage.setItem('token', t); },
  clearToken() { this.token = null; localStorage.removeItem('token'); },

  // Products
  getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/products?${qs}`);
  },
  getProduct(id) { return this.request(`/products/${id}`); },
  createProduct(d) { return this.request('/products', { method: 'POST', body: d }); },
  updateProduct(id, d) { return this.request(`/products/${id}`, { method: 'PUT', body: d }); },
  deleteProduct(id) { return this.request(`/products/${id}`, { method: 'DELETE' }); },

  // Categories
  getCategories() { return this.request('/categories'); },

  // Cart
  getCart() { return this.request(`/cart?sessionId=${App.sessionId}`); },
  addToCart(productId, qty = 1) { return this.request('/cart', { method: 'POST', body: { sessionId: App.sessionId, productId, quantity: qty } }); },
  updateCartItem(id, qty) { return this.request(`/cart/${id}`, { method: 'PUT', body: { quantity: qty } }); },
  removeCartItem(id) { return this.request(`/cart/${id}`, { method: 'DELETE' }); },
  clearCart() { return this.request(`/cart/clear/${App.sessionId}`, { method: 'DELETE' }); },

  // Orders
  placeOrder(d) { return this.request('/orders', { method: 'POST', body: { ...d, sessionId: App.sessionId } }); },
  getOrders(params = {}) { const qs = new URLSearchParams(params).toString(); return this.request(`/orders?${qs}`); },
  getOrder(id) { return this.request(`/orders/${id}`); },
  updateOrder(id, d) { return this.request(`/orders/${id}`, { method: 'PUT', body: d }); },
  trackOrder(id) { return this.request(`/orders/track/${id}`); },
  updateOrderPublic(id, d) { return this.request(`/orders/track/${id}`, { method: 'PUT', body: d }); },

  // Auth
  login(d) { return this.request('/auth/login', { method: 'POST', body: d }); },
  register(d) { return this.request('/auth/register', { method: 'POST', body: d }); },
  getProfile() { return this.request('/auth/profile'); },
  updateProfile(d) { return this.request('/auth/profile', { method: 'PUT', body: d }); },

  // OTP
  sendOTP(phone) { return this.request('/otp/send', { method: 'POST', body: { phone } }); },
  verifyOTP(phone, code) { return this.request('/otp/verify', { method: 'POST', body: { phone, code } }); },
};
