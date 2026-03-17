const App = {
  sessionId: localStorage.getItem('sessionId') || (() => { const id = 'sid_' + Math.random().toString(36).slice(2); localStorage.setItem('sessionId', id); return id; })(),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  isAdmin() { return this.user && this.user.role === 'admin'; },

  async addToCart(productId) {
    try {
      await API.addToCart(productId, 1);
      Components.toast('Added to cart!', 'success');
      this.updateCartBadge();
    } catch (err) { Components.toast(err.message, 'error'); }
  },

  async updateCartBadge() {
    try {
      const cart = await API.getCart();
      const badge = document.getElementById('cart-count');
      if (cart.count > 0) { badge.textContent = cart.count; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    } catch (e) {}
  },

  updateAuthNav() {
    const authLink = document.getElementById('nav-auth');
    if (this.user) {
      authLink.textContent = 'Sign Out';
    } else {
      authLink.textContent = 'Login';
    }
  },

  logout() {
    this.user = null;
    API.clearToken();
    localStorage.removeItem('user');
    this.updateAuthNav();
    Components.toast('Logged out', 'info');
    window.router.navigate('/auth');
  },

  syncUser() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.updateAuthNav();
  }
};

// Router
class Router {
  constructor() { this.routes = []; }
  add(pattern, handler) { this.routes.push({ pattern, handler }); return this; }
  navigate(path) { window.location.hash = '#' + path; }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    for (const r of this.routes) {
      const match = hash.match(r.pattern);
      if (match) { r.handler(match); return; }
    }
    
    // Default to admin dashboard if logged in, otherwise auth
    if (App.isAdmin()) adminOnly(() => AdminPage.render());
    else { this.navigate('/auth'); }
  }
}

const router = new Router();

// Admin-only guard: redirect non-admins to login
function adminOnly(renderFn) {
  if (!App.isAdmin()) {
    router.navigate('/auth');
    return;
  }
  renderFn();
}

router
  .add(/^\/$/, () => { document.getElementById('nav-admin')?.classList.add('active'); adminOnly(() => AdminPage.render()); })
  .add(/^\/auth$/, () => { document.getElementById('nav-auth')?.classList.add('active'); AuthPage.render(); setTimeout(() => AuthPage.init(), 100); })
  .add(/^\/admin$/, () => { document.getElementById('nav-admin')?.classList.add('active'); adminOnly(() => AdminPage.render()); })
  .add(/^\/inventory$/, () => { document.getElementById('nav-inventory')?.classList.add('active'); adminOnly(() => InventoryPage.render()); })
  .add(/^\/orders$/, () => { document.getElementById('nav-orders')?.classList.add('active'); adminOnly(() => OrdersPage.render()); })
  .add(/^\/analytics$/, () => { document.getElementById('nav-analytics')?.classList.add('active'); adminOnly(() => AnalyticsPage.render()); })
  .add(/^\/billing$/, () => { document.getElementById('nav-billing')?.classList.add('active'); adminOnly(() => BillingPage.render()); })
  .add(/^\/customers$/, () => { document.getElementById('nav-customers')?.classList.add('active'); adminOnly(() => CustomersPage.render()); })
  .add(/^\/custom-dashboard$/, () => { document.getElementById('nav-custom-dashboard')?.classList.add('active'); adminOnly(() => DashboardPage.render()); });

window.router = router;
window.addEventListener('hashchange', () => router.resolve());
window.addEventListener('DOMContentLoaded', () => {
  App.updateAuthNav();

  document.getElementById('nav-admin')?.addEventListener('click', () => router.navigate('/admin'));
  document.getElementById('nav-inventory')?.addEventListener('click', () => router.navigate('/inventory'));
  document.getElementById('nav-orders')?.addEventListener('click', () => router.navigate('/orders'));
  document.getElementById('nav-analytics')?.addEventListener('click', () => router.navigate('/analytics'));
  document.getElementById('nav-billing')?.addEventListener('click', () => router.navigate('/billing'));
  document.getElementById('nav-customers')?.addEventListener('click', () => router.navigate('/customers'));
  document.getElementById('nav-custom-dashboard')?.addEventListener('click', () => router.navigate('/custom-dashboard'));
  document.getElementById('nav-auth')?.addEventListener('click', () => {
    if (App.user) { App.logout(); } else { router.navigate('/auth'); }
  });

  router.resolve();
});
