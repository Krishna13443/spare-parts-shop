const API = {
  base: '/api',
  token: localStorage.getItem('token') || null,

  async request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const config = { ...options };
    
    config.headers = { ...options.headers };
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
      if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
    }
    
    if (this.token) config.headers['Authorization'] = `Bearer ${this.token}`;
    
    const res = await fetch(`${this.base}${path}`, config);
    if (res.status === 401) {
      this.clearToken();
      localStorage.removeItem('user');
      if (typeof App !== 'undefined' && App.syncUser) App.syncUser();
      
      if (!window.location.hash.includes('auth')) {
        window.location.hash = '#/auth';
        setTimeout(() => alert('Session expired. Please login again.'), 100);
      }
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
  updateProductStock(id, stock) { return this.request(`/products/${id}`, { method: 'PUT', body: { stock } }); },
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

  // Auth
  login(d) { return this.request('/auth/login', { method: 'POST', body: d }); },
  register(d) { return this.request('/auth/register', { method: 'POST', body: d }); },
  getProfile() { return this.request('/auth/profile'); },

  // Analytics
  getInventoryAnalytics() { return this.request('/analytics/inventory'); },

  // Billing
  saveInvoice(d) { return this.request('/billing/save', { method: 'POST', body: d }); },

  // OTP
  sendOTP(phone) { return this.request('/otp/send', { method: 'POST', body: { phone } }); },
  verifyOTP(phone, code) { return this.request('/otp/verify', { method: 'POST', body: { phone, code } }); },

  // OTP Login
  loginOtpRequest(emailOrPhone) { return this.request('/auth/login-otp/request', { method: 'POST', body: { emailOrPhone } }); },
  loginOtpVerify(emailOrPhone, code) { return this.request('/auth/login-otp/verify', { method: 'POST', body: { emailOrPhone, code } }); },
  resetPassword(d) { return this.request('/auth/reset-password', { method: 'POST', body: d }); },

  // Challenge Orders
  getChallengeOrders() { return this.request('/challenge'); },
  createChallengeOrder(d) { return this.request('/challenge', { method: 'POST', body: d }); },
  updateChallengeOrder(id, d) { return this.request(`/challenge/${id}`, { method: 'PUT', body: d }); },
  deleteChallengeOrder(id) { return this.request(`/challenge/${id}`, { method: 'DELETE' }); },

  // Widgets
  getWidgets() { return this.request('/widgets'); },
  createWidget(d) { return this.request('/widgets', { method: 'POST', body: d }); },
  updateWidget(id, d) { return this.request(`/widgets/${id}`, { method: 'PUT', body: d }); },
  deleteWidget(id) { return this.request(`/widgets/${id}`, { method: 'DELETE' }); },
};
