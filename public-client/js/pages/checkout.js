const CheckoutPage = {
  async render() {
    const c = document.getElementById('page-content');
    c.innerHTML = Components.loading();
    try {
      const cart = await API.getCart();
      if (!cart || !cart.items || !cart.items.length) { 
        window.router.navigate('/cart'); 
        return; 
      }
      this.renderForm(cart);
    } catch (err) { 
      console.error('Checkout error:', err);
      c.innerHTML = Components.emptyState('⚠️', 'Failed to load checkout details. Please try again.'); 
    }
  },

  renderForm(cart) {
    const c = document.getElementById('page-content');
    const user = App.user;
    
    // Mobile verification no longer required
    
    const upiNumber = '9080799320';
    const upiLink = `upi://pay?pa=${upiNumber}@upi&pn=SparkMotors&am=${cart.total}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;

    c.innerHTML = `
      <div class="fade-in-up" style="max-width:1200px;margin:0 auto">
        <button class="back-link" onclick="window.router.navigate('/cart')" style="margin-bottom:24px">← Back to Cart</button>
        
        <div style="margin-bottom:32px">
          <h1 style="font-size:2.4rem;margin-bottom:8px">Checkout</h1>
          <p style="color:var(--text-secondary)">Complete your order for premium spare parts.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 380px;gap:40px;align-items:start">
          <div style="display:flex;flex-direction:column;gap:32px">
            
            <!-- Step 1: Shipping Info -->
            <div class="card" style="padding:32px">
              <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
                <span style="width:32px;height:32px;background:var(--accent-gradient);color:var(--bg-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900">1</span>
                <h3 style="margin:0">Shipping Information</h3>
              </div>

              <div class="input-group">
                <label>Full Name *</label>
                <input class="input" id="co-name" value="${user ? Components.escapeHtml(user.name) : ''}" placeholder="First and Last name">
                <div class="field-error" id="err-name" style="color:var(--danger);font-size:0.75rem;margin-top:4px;display:none"></div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                <div class="input-group">
                  <label>Email Address</label>
                  <input class="input" id="co-email" type="email" value="${user ? Components.escapeHtml(user.email) : ''}" placeholder="email@example.com">
                  <div class="field-error" id="err-email" style="color:var(--danger);font-size:0.75rem;margin-top:4px;display:none"></div>
                </div>
                <div class="input-group">
                  <label>Mobile Number *</label>
                  <input class="input" id="co-phone" type="tel" value="${user ? user.phone : ''}" placeholder="10-digit mobile number">
                  <div class="field-error" id="err-phone" style="color:var(--danger);font-size:0.75rem;margin-top:4px;display:none"></div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:12px">
                <div class="input-group">
                  <label>Shop Name (Optional)</label>
                  <input class="input" id="co-shop-name" value="${user ? (user.shopName || '') : ''}" placeholder="Business/Shop Name">
                </div>
                <div class="input-group">
                  <label>GST Number (Optional)</label>
                  <input class="input" id="co-gst" value="${user ? (user.gstNumber || '') : ''}" placeholder="15-digit GSTIN">
                </div>
              </div>

              <div class="input-group">
                <label>Shop/Delivery Address *</label>
                <textarea class="textarea" id="co-address-lines" placeholder="Street Address, Building, Landmark" style="min-height:80px">${user ? (user.addressLines || '') : ''}</textarea>
                <div class="field-error" id="err-address-lines" style="color:var(--danger);font-size:0.75rem;margin-top:4px;display:none"></div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
                <div class="input-group">
                  <label>City *</label>
                  <input class="input" id="co-city" value="${user ? (user.city || '') : ''}" placeholder="City">
                  <div class="field-error" id="err-city" style="color:var(--danger);font-size:0.75rem;margin-top:4px;display:none"></div>
                </div>
                <div class="input-group">
                  <label>Pincode *</label>
                  <input class="input" id="co-pincode" maxlength="6" value="${user ? (user.pincode || '') : ''}" placeholder="6-digit PIN">
                  <div class="field-error" id="err-pincode" style="color:var(--danger);font-size:0.75rem;margin-top:4px;display:none"></div>
                </div>
                <div class="input-group">
                  <label>Landmark</label>
                  <input class="input" id="co-landmark" value="${user ? (user.landmark || '') : ''}" placeholder="Nearby known place">
                </div>
              </div>
            </div>

            <!-- Step 2: Payment Method -->
            <div class="card" style="padding:32px">
              <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
                <span style="width:32px;height:32px;background:var(--accent-gradient);color:var(--bg-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900">2</span>
                <h3 style="margin:0">Payment & Review</h3>
              </div>

              <div class="input-group">
                <label>Choose a Payment Method</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
                  <label class="payment-radio-label">
                    <input type="radio" name="payment" value="cod" checked>
                    <div class="payment-card-inner">
                      <span style="font-size:1.5rem">💵</span>
                      <span>Cash on Delivery</span>
                    </div>
                  </label>
                  <label class="payment-radio-label">
                    <input type="radio" name="payment" value="upi">
                    <div class="payment-card-inner">
                      <span style="font-size:1.5rem">UPI</span>
                      <span>Scan & Pay (Fast)</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- UPI Details Section -->
              <div id="upi-section" style="display:none;margin-top:24px;padding:24px;background:var(--bg-secondary);border:1px solid var(--border-copper);border-radius:var(--radius-md) text-align:center">
                <h4 style="color:var(--copper-light);margin-bottom:12px">Scan QR Code to Pay</h4>
                <div style="background:#fff;padding:16px;border-radius:12px;display:inline-block;margin-bottom:16px;box-shadow:var(--shadow-md)">
                  <img src="${qrCodeUrl}" alt="UPI QR" style="display:block;width:180px;height:180px">
                </div>
                <p style="font-size:1.1rem;font-weight:700;color:var(--success);margin-bottom:16px">Pay ₹${cart.total.toLocaleString('en-IN')}</p>
                <div class="input-group" style="text-align:left">
                  <label>Transaction ID / UTR Number *</label>
                  <input class="input" id="co-upi-tx" placeholder="Enter 12-digit UPI Transaction ID">
                  <p style="font-size:0.7rem;color:var(--text-muted);margin-top:6px">Verification required for UPI payments before shipping.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sticky Sidebar Summary -->
          <div style="position:sticky;top:100px">
            <div class="card" style="padding:24px;background:var(--bg-secondary);border-color:var(--border-copper)">
              <h3 style="margin-bottom:20px;font-size:1.2rem">Order Summary</h3>
              
              <div style="max-height:200px;overflow-y:auto;padding-right:8px;margin-bottom:20px">
                ${cart.items.map(item => `
                  <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                    <div style="font-size:0.85rem;color:var(--text-secondary)">
                      <span style="font-weight:600;color:var(--text-primary)">${item.quantity}x</span> 
                      ${Components.escapeHtml(item.product.name)}
                    </div>
                    <div style="font-size:0.85rem;font-weight:600">${Components.formatPrice(item.product.price * item.quantity)}</div>
                  </div>
                `).join('')}
              </div>

              <div style="border-top:1px solid var(--border-subtle);padding-top:16px;display:grid;gap:8px">
                <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--text-secondary)">
                  <span>Subtotal</span>
                  <span>${Components.formatPrice(cart.total)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--success)">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:1.3rem;font-weight:800;margin-top:12px;border-top:1px solid var(--border-bright);padding-top:12px">
                  <span>Total</span>
                  <span style="color:var(--copper-light)">${Components.formatPrice(cart.total)}</span>
                </div>
              </div>

              <button class="btn btn-primary btn-lg" id="btn-place-order" style="width:100%;justify-content:center;margin-top:24px;border-radius:var(--radius-md)">
                Place Your Order
              </button>
              
              <p style="font-size:0.7rem;color:var(--text-muted);text-align:center;margin-top:16px">
                By placing your order, you agree to SparkMotors' <br>
                <a href="#" style="color:var(--copper-light)">Terms & Conditions</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>
        .payment-radio-label { cursor:pointer; }
        .payment-radio-label input { display:none; }
        .payment-card-inner {
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-tertiary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all var(--transition-fast);
          color: var(--text-secondary);
        }
        .payment-radio-label input:checked + .payment-card-inner {
          border-color: var(--copper);
          background: var(--copper-glow);
          color: var(--text-primary);
          box-shadow: 0 0 15px var(--copper-glow);
        }
        .pulse { animation: pulse-orange 1.5s infinite; }
        .verified-input { background: rgba(16, 185, 129, 0.05) !important; border-color: var(--success) !important; }
        @keyframes pulse-orange {
          0% { box-shadow: 0 0 0 0 rgba(212, 140, 77, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(212, 140, 77, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 140, 77, 0); }
        }
      </style>
    `;

    // --- EVENT BINDINGS ---
    
    // Payment Toggle
    document.getElementsByName('payment').forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.getElementById('upi-section').style.display = e.target.value === 'upi' ? 'block' : 'none';
      });
    });

    // Place Order
    document.getElementById('btn-place-order').addEventListener('click', async () => {

      if (!this.validateForm()) return;

      const name = document.getElementById('co-name').value.trim();
      const email = document.getElementById('co-email').value.trim();
      const phone = document.getElementById('co-phone').value.trim();
      const shopName = document.getElementById('co-shop-name').value.trim();
      const gst = document.getElementById('co-gst').value.trim();
      const addressLines = document.getElementById('co-address-lines').value.trim();
      const city = document.getElementById('co-city').value.trim();
      const pincode = document.getElementById('co-pincode').value.trim();
      const landmark = document.getElementById('co-landmark').value.trim();
      const payment = document.querySelector('input[name="payment"]:checked').value;
      const upiTx = payment === 'upi' ? document.getElementById('co-upi-tx').value.trim() : '';

      try {
        const btn = document.getElementById('btn-place-order');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px"></div> Submitting...';

        const addressSummary = `${shopName ? shopName + ' - ' : ''}${addressLines}${landmark ? ', ' + landmark : ''}, ${city} - ${pincode}`;

        const order = await API.placeOrder({
          sessionId: App.sessionId,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: addressSummary,
          paymentMethod: payment,
          upiTransactionId: upiTx,
          shopName, addressLines, city, pincode, landmark
        });

        Components.toast('Order placed successfully! 🎉', 'success');
        this.renderSuccess(order.id, name, phone, addressSummary, payment);
      } catch (err) {
        Components.toast(err.message, 'error');
        const btn = document.getElementById('btn-place-order');
        btn.disabled = false;
        btn.innerHTML = 'Place Your Order';
      }
    });

    // No extra OTP bindings needed
  },

  validateForm() {
    let valid = true;
    const name = document.getElementById('co-name').value.trim();
    if (!name || name.length < 3) {
      this.showError('err-name', 'Full name is required (min 3 chars)');
      valid = false;
    } else { this.clearError('err-name'); }

    const address = document.getElementById('co-address-lines').value.trim();
    if (!address || address.length < 10) {
      this.showError('err-address-lines', 'Please enter a complete delivery address');
      valid = false;
    } else { this.clearError('err-address-lines'); }

    const phone = document.getElementById('co-phone').value.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      this.showError('err-phone', 'Enter a valid 10-digit Indian mobile number');
      valid = false;
    } else { this.clearError('err-phone'); }

    const city = document.getElementById('co-city').value.trim();
    if (!city) { this.showError('err-city', 'City is required'); valid = false; }
    else { this.clearError('err-city'); }

    const pin = document.getElementById('co-pincode').value.trim();
    if (!/^\d{6}$/.test(pin)) {
      this.showError('err-pincode', 'Enter a valid 6-digit pincode');
      valid = false;
    } else { this.clearError('err-pincode'); }

    return valid;
  },

  showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.parentElement.querySelector('input, textarea')?.classList.add('error');
  },

  clearError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'none';
    el.parentElement.querySelector('input, textarea')?.classList.remove('error');
  },

  renderSuccess(orderId, name, phone, address, payment) {
    const c = document.getElementById('page-content');
    c.innerHTML = `
      <div class="fade-in-up" style="max-width:600px;margin:40px auto;text-align:center">
        <div style="width:80px;height:80px;background:var(--success);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3rem;margin:0 auto 24px;box-shadow:0 0 30px rgba(16, 185, 129, 0.3)">✓</div>
        <h1 style="font-size:2.4rem;margin-bottom:12px">Order placed successfully!</h1>
        <p style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:40px">
          Thank you, <strong>${Components.escapeHtml(name)}</strong>. <br>
          We've received your order and are processing it now.
        </p>

        <div class="card" style="padding:32px;text-align:center;border:2px dashed var(--copper-glow);margin-bottom:32px">
          <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Your Tracking ID</p>
          <h2 style="font-family:monospace;letter-spacing:3px;font-size:2rem;margin-bottom:16px">${orderId}</h2>
          <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${orderId}');Components.toast('Copied to ID clipboard!','info')">
            📋 Copy Tracking ID
          </button>
        </div>

        <div class="card" style="text-align:left;padding:24px;background:var(--bg-tertiary)">
          <p style="margin-bottom:8px;font-size:0.9rem"><strong>Phone:</strong> ${Components.escapeHtml(phone)}</p>
          <p style="margin-bottom:16px;font-size:0.9rem;color:var(--text-secondary)"><strong>Ship To:</strong> ${Components.escapeHtml(address)}</p>
          <p style="background:var(--bg-secondary);padding:12px;border-radius:var(--radius-sm);font-size:0.8rem;color:var(--copper-light)">
            ℹ️ You can track your order status anytime using the "Orders" link in the menu.
          </p>
        </div>

        <div style="display:flex;gap:16px;justify-content:center;margin-top:40px">
          <button class="btn btn-secondary btn-lg" onclick="window.router.navigate('/')">Back to Home</button>
          <button class="btn btn-primary btn-lg" onclick="window.router.navigate('/my-orders?id=${orderId}')">Track Order →</button>
        </div>
      </div>
    `;
  }
};
