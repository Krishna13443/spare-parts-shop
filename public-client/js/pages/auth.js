const AuthPage = {
  render() {
    const c = document.getElementById('page-content');
    if (App.user) { this.renderProfile(); return; }

    c.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Track Your Orders</h2>
          <p class="subtitle">Login to check your order status</p>
          <div class="auth-tabs">
            <button class="auth-tab active" id="tab-login" onclick="AuthPage.switchTab('login')">Login</button>
            <button class="auth-tab" id="tab-register" onclick="AuthPage.switchTab('register')">Register</button>
          </div>
          <div id="auth-form">${this.loginForm()}</div>
        </div>
      </div>
    `;
    this.bindEvents('login');
  },

  loginForm() {
    return `
      <form id="form-login">
        <div class="input-group"><label>Email or Username</label><input class="input" id="auth-identifier" placeholder="Email / Username" required></div>
        <div class="input-group"><label>Password</label><input class="input" id="auth-password" type="password" placeholder="••••••••" required></div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%;justify-content:center" id="btn-login">Login →</button>
      </form>
      <div style="margin: 16px 0; display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.8rem">
        <div style="flex:1; height:1px; background:var(--border-subtle)"></div>
        <span>OR</span>
        <div style="flex:1; height:1px; background:var(--border-subtle)"></div>
      </div>
      <button class="btn btn-secondary btn-lg" style="width:100%;justify-content:center;gap:8px" onclick="AuthPage.openOtpLogin()">📱 Login with OTP</button>
    `;
  },

  registerForm() {
    return `
      <form id="form-register">
        <div class="input-group"><label>Full Name *</label><input class="input" id="auth-name" placeholder="Enter your full name" required></div>
        <div class="input-group"><label>Email *</label><input class="input" id="auth-email" type="email" placeholder="you@email.com" required></div>
        <div class="input-group"><label>Phone * (10 digits)</label><input class="input" id="auth-phone" type="tel" placeholder="Enter 10-digit mobile number" required></div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
          <div class="input-group"><label>Shop Name</label><input class="input" id="auth-shop-name" placeholder="Business Name"></div>
          <div class="input-group"><label>GST Number</label><input class="input" id="auth-gst" placeholder="GSTIN (Optional)"></div>
        </div>

        <div class="input-group"><label>About Business / Bio</label><textarea class="textarea" id="auth-bio" placeholder="Tell us about your business..." style="min-height:60px"></textarea></div>

        <div class="input-group"><label>Password *</label><input class="input" id="auth-password" type="password" placeholder="Min 6 characters" required></div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:8px" id="btn-register">Create Account →</button>
      </form>
    `;
  },

  switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById('auth-form').innerHTML = tab === 'login' ? this.loginForm() : this.registerForm();
    this.bindEvents(tab);
  },

  bindEvents(tab) {
    if (tab === 'login') {
      const form = document.getElementById('form-login');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('auth-identifier').value.trim();
        const password = document.getElementById('auth-password').value;
        try {
          // Backend login supports username OR email in 'username' field usually, 
          // but we'll send it based on common logic
          const d = identifier.includes('@') ? { email: identifier, password } : { username: identifier, password };
          const data = await API.login(d);
          this.onAuthSuccess(data);
        } catch (err) { Components.toast(err.message, 'error'); }
      });
    } else {
      document.getElementById('form-register')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('auth-name').value.trim();
        const email = document.getElementById('auth-email').value.trim();
        const phone = document.getElementById('auth-phone').value.trim();
        const shopName = document.getElementById('auth-shop-name').value.trim();
        const gstNumber = document.getElementById('auth-gst').value.trim();
        const bio = document.getElementById('auth-bio').value.trim();
        const password = document.getElementById('auth-password').value;

        if (!/^[6-9]\d{9}$/.test(phone)) return Components.toast('Please enter a valid 10-digit phone number', 'error');
        if (password.length < 6) return Components.toast('Password too short', 'error');

        try {
           const data = await API.register({ name, email, phone, shopName, gstNumber, bio, password, username: email.split('@')[0] });
           this.onAuthSuccess(data);
        } catch (err) { Components.toast(err.message, 'error'); }
      });
    }
  },

  openOtpLogin() {
    Components.openModal('Login with OTP', `
      <p style="margin-bottom:16px;font-size:0.9rem;color:var(--text-secondary)">Enter your registered email or phone to receive a 6-digit code.</p>
      <div class="input-group">
        <label>Email or Phone</label>
        <input class="input" id="modal-otp-id" placeholder="you@example.com or mobile">
      </div>
      <div class="input-group" id="modal-otp-verify-group" style="display:none">
        <label>6-Digit Code</label>
        <input class="input" id="modal-otp-code" placeholder="000000" maxlength="6" style="text-align:center;font-size:1.4rem;letter-spacing:10px">
      </div>
      <button class="btn btn-primary btn-lg" id="btn-modal-send" style="width:100%;justify-content:center;margin-top:8px">Send OTP →</button>
      <button class="btn btn-primary btn-lg" id="btn-modal-verify" style="width:100%;justify-content:center;margin-top:8px;display:none">Verify & Login →</button>
    `, `
      <button class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
    `);

    const btnSend = document.getElementById('btn-modal-send');
    const btnVerify = document.getElementById('btn-modal-verify');
    const idInput = document.getElementById('modal-otp-id');
    const codeGroup = document.getElementById('modal-otp-verify-group');

    btnSend.onclick = async () => {
      const id = idInput.value.trim();
      if (!id) return Components.toast('Required input', 'error');
      try {
        const res = await API.loginOtpRequest(id);
        Components.toast(res.message, 'success');
        btnSend.style.display = 'none';
        btnVerify.style.display = 'flex';
        codeGroup.style.display = 'block';
        idInput.disabled = true;
      } catch (err) { Components.toast(err.message, 'error'); }
    };

    btnVerify.onclick = async () => {
      const code = document.getElementById('modal-otp-code').value.trim();
      try {
        const data = await API.loginOtpVerify(idInput.value.trim(), code);
        this.onAuthSuccess(data);
        Components.closeModal();
      } catch (err) { Components.toast(err.message, 'error'); }
    };
  },

  onAuthSuccess(data) {
    API.setToken(data.token);
    App.user = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    Components.toast(`Welcome, ${data.user.name}!`, 'success');
    App.updateAuthNav();
    window.router.navigate('/');
  },

  renderProfile() {
    const u = App.user;
    document.getElementById('page-content').innerHTML = `
      <div class="auth-container">
        <div class="auth-card" style="text-align:center">
          <div style="width:72px;height:72px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.8rem;font-weight:900;color:#000">${u.name.charAt(0)}</div>
          <h2>Hello, ${u.name}</h2>
          <p style="color:var(--text-secondary);margin-bottom:8px">${u.email}</p>
          ${u.shopName ? `<p style="font-weight:700;color:var(--copper-light);margin-bottom:4px">🏪 ${Components.escapeHtml(u.shopName)}</p>` : ''}
          ${u.gstNumber ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px">GST: ${u.gstNumber}</p>` : ''}
          
          ${u.bio ? `
            <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:24px;font-size:0.85rem;color:var(--text-secondary);font-style:italic">
              "${Components.escapeHtml(u.bio)}"
            </div>
          ` : ''}

          <div style="display:flex;flex-direction:column;gap:12px">
            <button class="btn btn-primary btn-lg" style="justify-content:center" onclick="window.router.navigate('/my-orders')">📦 View My Orders</button>
            <button class="btn btn-secondary" style="justify-content:center" onclick="App.logout()">Logout</button>
          </div>
        </div>
      </div>
    `;
  },

  init() {}
};
