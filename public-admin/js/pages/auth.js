const AuthPage = {
  render() {
    const c = document.getElementById('page-content');
    if (App.user) { this.renderProfile(); return; }

    c.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:50px;height:50px;background:var(--accent-gradient);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
              <span style="font-size:1.5rem">🔐</span>
            </div>
            <h2 style="margin-bottom:4px">Admin Access</h2>
            <p class="subtitle" style="font-size:0.85rem;color:var(--text-muted)">Secure login for SparkMotors Console</p>
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
        <div class="input-group">
          <label>Admin ID (Phone/Email)</label>
          <input class="input" id="auth-username" name="username" placeholder="Registered mobile or email" required>
        </div>
        <div class="input-group">
          <label>Admin Passcode</label>
          <input class="input" id="auth-password" name="password" type="password" inputmode="numeric" placeholder="Your numeric passcode" required style="text-align:center;font-size:1.5rem;letter-spacing:4px">
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:0.8rem">
          <a href="javascript:void(0)" onclick="AuthPage.switchTab('otp-request')" style="color:var(--text-secondary)">Try OTP Login</a>
          <a href="javascript:void(0)" onclick="AuthPage.switchTab('forgot-password')" style="color:var(--copper-light);font-weight:700">Forgot Passcode?</a>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%;justify-content:center" id="btn-login">Enter Dashboard →</button>
      </form>
      <p style="text-align:center;margin-top:20px;color:var(--text-muted);font-size:0.75rem;opacity:0.6">© 2026 SparkMotors Management System</p>
    `;
  },

  otpRequestForm() {
    return `
      <p class="subtitle" style="margin-bottom:20px">OTP Login (Registered Email/Mobile)</p>
      <div class="input-group"><label>Email or Phone Number</label><input class="input" id="auth-otp-id" type="tel" placeholder="admin@email.com or +91..."></div>
      <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center" id="btn-request-otp">Get Admin Access Code →</button>
      <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:0.8rem">
        <a href="javascript:void(0)" onclick="AuthPage.switchTab('login')" style="color:var(--text-muted)">Back to Password Login</a>
        <a href="javascript:void(0)" onclick="AuthPage.switchTab('forgot-password')" style="color:var(--copper-light)">Forgot Password?</a>
      </div>
    `;
  },

  otpVerifyForm(phone) {
    return `
      <p class="subtitle" style="margin-bottom:20px">Enter the code sent to <strong>${phone}</strong></p>
      <div class="input-group"><label>OTP Code</label><input class="input" id="auth-otp-code" type="text" inputmode="numeric" placeholder="000000" maxlength="6" style="text-align:center;font-size:1.5rem;letter-spacing:8px"></div>
      <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center" id="btn-verify-otp" data-phone="${phone}">Verify & Login →</button>
      <p style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="AuthPage.switchTab('otp-request')" style="font-size:0.8rem;color:var(--text-muted)">Resend OTP</a></p>
    `;
  },

  forgotPasswordForm() {
    return `
      <p class="subtitle" style="margin-bottom:20px">Reset password via registered phone number</p>
      <div class="input-group"><label>Mobile Number</label><input class="input" id="forgot-phone" type="tel" placeholder="Enter 10-digit mobile number"></div>
      <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center" id="btn-forgot-send">Send Reset OTP →</button>
      <p style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="AuthPage.switchTab('login')" style="font-size:0.8rem;color:var(--text-muted)">Back to Login</a></p>
    `;
  },

  resetPasswordForm(phone) {
    return `
      <p class="subtitle" style="margin-bottom:20px">Resetting password for <strong>${phone}</strong></p>
      <div id="reset-step-container">
        <div class="input-group">
          <label>6-Digit Reset Code</label>
          <input class="input" id="reset-otp" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="000000" maxlength="6" style="text-align:center;font-size:1.5rem;letter-spacing:10px">
        </div>
        <div class="input-group">
          <label>New Passcode (Numbers only)</label>
          <input class="input" id="reset-password" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Enter new numeric passcode" style="text-align:center;font-size:1.5rem;letter-spacing:4px">
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;background:var(--accent-gradient);color:#000" id="btn-reset-confirm" data-phone="${phone}">Update Admin Passcode →</button>
      </div>
      <p style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="AuthPage.switchTab('login')" style="font-size:0.8rem;color:var(--text-muted)">Cancel and Back to Login</a></p>
    `;
  },


  switchTab(tab, identifier = '') {
    const container = document.getElementById('auth-form');
    if (tab === 'login') container.innerHTML = this.loginForm();
    else if (tab === 'otp-request') container.innerHTML = this.otpRequestForm();
    else if (tab === 'otp-verify') container.innerHTML = this.otpVerifyForm(identifier);
    else if (tab === 'forgot-password') container.innerHTML = this.forgotPasswordForm();
    else if (tab === 'reset-password') container.innerHTML = this.resetPasswordForm(identifier);

    this.bindEvents(tab);
  },

  bindEvents(tab) {
    if (tab === 'login') {
      const handleLogin = async (e) => {
        if (e) e.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        try {
          const data = await API.login({ username, password });
          this.onAuthSuccess(data);
        } catch (err) { Components.toast(err.message, 'error'); }
      };
      document.getElementById('form-login')?.addEventListener('submit', handleLogin);
    } 
    else if (tab === 'otp-request') {
      document.getElementById('btn-request-otp')?.addEventListener('click', async () => {
        const identifier = document.getElementById('auth-otp-id').value.trim();
        if (!identifier) return Components.toast('Required field missing', 'error');
        try {
          const res = await API.loginOtpRequest(identifier);
          Components.toast(res.message, 'success');
          this.switchTab('otp-verify', identifier);
        } catch (err) { Components.toast(err.message, 'error'); }
      });
    }
    else if (tab === 'otp-verify') {
      document.getElementById('btn-verify-otp')?.addEventListener('click', async (e) => {
        const phone = e.target.dataset.phone;
        const code = document.getElementById('auth-otp-code').value.trim();
        try {
          const data = await API.loginOtpVerify(phone, code);
          this.onAuthSuccess(data);
        } catch (err) { Components.toast(err.message, 'error'); }
      });
    }
    else if (tab === 'forgot-password') {
      document.getElementById('btn-forgot-send')?.addEventListener('click', async () => {
        const phone = document.getElementById('forgot-phone').value.trim();
        if (!phone || phone.length < 10) return Components.toast('Please enter a valid phone number', 'error');
        
        try {
          const res = await API.sendOTP(phone);
          Components.toast(res.message || 'OTP Sent! Check your mobile.', 'success');
          this.switchTab('reset-password', phone);
        } catch (err) { Components.toast(err.message, 'error'); }
      });
    }
    else if (tab === 'reset-password') {
      document.getElementById('btn-reset-confirm')?.addEventListener('click', async (e) => {
        const btn = e.target;
        const phone = btn.dataset.phone;
        const code = document.getElementById('reset-otp').value.trim();
        const newPassword = document.getElementById('reset-password').value.trim();
        
        if (code.length < 4) return Components.toast('Enter valid 6-digit code', 'error');
        if (newPassword.length < 4) return Components.toast('Passcode too short (min 4 digits)', 'error');
        
        try {
          btn.disabled = true;
          btn.textContent = 'Updating...';
          await API.resetPassword({ phone, code, newPassword });
          Components.toast('Passcode updated successfully! 🔐', 'success');
          setTimeout(() => this.switchTab('login'), 1500);
        } catch (err) { 
          Components.toast(err.message, 'error'); 
          btn.disabled = false;
          btn.textContent = 'Update Admin Passcode →';
        }
      });
    }
  },

  onAuthSuccess(data) {
    if (data.user.role !== 'admin') {
      Components.toast('Access Denied: Admin role required for this console.', 'error');
      API.clearToken();
      return;
    }
    API.setToken(data.token);
    App.user = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    Components.toast(`Welcome, Administrator ${data.user.name}`, 'success');
    App.updateAuthNav();
    window.router.navigate('/');
  },

  renderProfile() {
    const u = App.user;
    document.getElementById('page-content').innerHTML = `
      <div class="auth-container">
        <div class="auth-card" style="text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.5rem;font-weight:800;color:#000">${u.name.charAt(0)}</div>
          <h2>${u.name}</h2>
          <p style="color:var(--text-secondary)">${u.role.toUpperCase()} ACCOUNT</p>
          <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px">
            <button class="btn btn-primary" onclick="window.router.navigate('/')">Go to Dashboard</button>
            <button class="btn btn-secondary" onclick="App.logout()">Logout</button>
          </div>
        </div>
      </div>
    `;
  },

  init() {}
};
