const App = {
  sessionId: localStorage.getItem('sessionId') || (() => { const id = 'sid_' + Math.random().toString(36).slice(2); localStorage.setItem('sessionId', id); return id; })(),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

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
    // Always show 'Orders' as the label per user request
    authLink.textContent = '📦 Orders';
  },

  logout() {
    this.user = null;
    API.clearToken();
    localStorage.removeItem('user');
    this.updateAuthNav();
    Components.toast('Logged out', 'info');
    window.router.navigate('/');
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
    HomePage.render();
  }
}

const router = new Router();

router
  .add(/^\/$/, () => { document.getElementById('nav-home')?.classList.add('active'); HomePage.render(); })
  .add(/^\/products\/([a-f0-9-]+)$/, m => { document.getElementById('nav-products')?.classList.add('active'); ProductDetailPage.render(m[1]); })
  .add(/^\/products(.*)$/, m => {
    document.getElementById('nav-products')?.classList.add('active');
    const params = new URLSearchParams(m[1]?.replace('?',''));
    ProductsPage.render({ category: params.get('category')||'', search: params.get('search')||'', featured: params.get('featured')||'' });
  })
  .add(/^\/cart$/, () => { document.getElementById('nav-cart')?.classList.add('active'); CartPage.render(); })
  .add(/^\/checkout$/, () => { CheckoutPage.render(); })
  .add(/^\/my-orders(?:\?(.*))?$/, m => { 
    document.getElementById('nav-auth')?.classList.add('active'); 
    const params = new URLSearchParams(m[1] || '');
    MyOrdersPage.render({ id: params.get('id') }); 
  });

window.router = router;
window.addEventListener('hashchange', () => router.resolve());
window.addEventListener('DOMContentLoaded', () => {
  App.updateCartBadge();
  App.updateAuthNav();

  document.getElementById('nav-home').addEventListener('click', () => router.navigate('/'));
  document.getElementById('nav-products').addEventListener('click', () => router.navigate('/products'));
  document.getElementById('nav-cart').addEventListener('click', () => router.navigate('/cart'));
  document.getElementById('nav-auth').addEventListener('click', () => {
    router.navigate('/my-orders');
  });

  router.resolve();
});
