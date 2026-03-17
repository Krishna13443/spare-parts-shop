const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { rateLimiter } = require('../middleware/security');
const otpStore = require('../utils/otp-store');
const twilioService = require('../services/twilio');
const emailService = require('../services/email');
const mockAdminStore = require('../utils/mock-admin-store');

// Disable command buffering globally to prevent hangs when DB is disconnected
mongoose.set('bufferCommands', false);

const loginLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many login attempts. Please wait a bit.' });
const otpLimiter = rateLimiter({ windowMs: 10 * 60 * 1000, max: 100, message: 'Too many OTP requests. Please wait a bit.' });

const JWT_SECRET = process.env.JWT_SECRET || 'spare-parts-shop-secret-2026';

// Helper to map Mongo _id to id for frontend
const mapUser = (user) => {
  const obj = user.toObject();
  obj.id = obj._id;
  delete obj.password;
  return obj;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
    
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });
    
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) return res.status(400).json({ error: 'Username already taken' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      username: username || '', 
      email, 
      password: hashed, 
      phone: phone || '',
      role: (username || email.includes('admin')) ? 'admin' : 'customer' // Simple heuristic for admin
    });
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: mapUser(user), token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = username || email;
    if (!identifier || !password) return res.status(400).json({ error: 'Username/Email and password required' });
    
    let user;
    // CRITICAL: Check DB before trying findOne to avoid crash in Limited Mode
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ 
        $or: [{ email: identifier }, { username: identifier }] 
      });
    }
    
    // Fallback if DB is disconnected or user not found but we have a demo override
    const digitsOnly = identifier.replace(/\D/g, '');
    const cleanId = (digitsOnly.length >= 10) ? digitsOnly.slice(-10) : identifier;

    if (!user) {
      if ((mongoose.connection.readyState !== 1 || !user) && mockAdminStore.hasOverride(cleanId)) {
        if (password === mockAdminStore.getPasscode(cleanId)) {
           const token = jwt.sign({ id: 'admin_mock', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
           return res.json({ user: { id: 'admin_mock', name: 'Demo Admin', role: 'admin', phone: identifier }, token });
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: mapUser(user), token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/profile
router.get('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided' });
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Handle mock admin session
    if (decoded.id === 'admin_mock') {
      return res.json({ id: 'admin_mock', name: 'Demo Admin', role: 'admin' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(mapUser(user));
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
});

// PUT /api/auth/profile — Update user details
router.put('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided' });
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findByIdAndUpdate(decoded.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'Profile updated', user: mapUser(user) });
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
});

// POST /api/auth/login-otp/request
router.post('/login-otp/request', otpLimiter, async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ error: 'Email or Phone required' });

    let user;
    const digitsOnly = emailOrPhone.replace(/\D/g, '');
    const cleanId = (digitsOnly.length >= 10) ? digitsOnly.slice(-10) : emailOrPhone;

    if (mongoose.connection.readyState !== 1) {
      // In Limited Mode, allow mock admin to proceed
      if (mockAdminStore.hasOverride(cleanId)) {
        user = { id: 'admin_mock', name: 'Demo Admin', role: 'admin', phone: cleanId };
      } else {
        return res.status(403).json({ error: 'System is in Limited Mode. Database is disconnected.' });
      }
    } else {
      user = await User.findOne({ 
        $or: [
          { email: emailOrPhone }, 
          { phone: { $regex: cleanId + "$" } }
        ] 
      });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });
    const phone = user.phone || emailOrPhone;
    
    // Generate code
    const isConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const code = isConfigured ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';
    
    // Store it
    otpStore.set(emailOrPhone, { code });

    console.log(`[AUTH] fresh OTP ${code} generated for ${phone}`);

    if (isConfigured) {
      await twilioService.sendOTP(phone, code).catch(e => console.error('OTP Send Fail:', e.message));
    }
    
    res.json({ 
      message: isConfigured ? 'OTP sent successfully.' : 'Verification Preview: Use code ' + code, 
      phone, 
      mock: !isConfigured 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login-otp/verify
router.post('/login-otp/verify', async (req, res) => {
  try {
    const { emailOrPhone, code } = req.body;
    if (!emailOrPhone || !code) return res.status(400).json({ error: 'Phone/Email and OTP code required' });
    
    const stored = otpStore.get(emailOrPhone);
    if (!stored || stored.code !== code) {
       return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    otpStore.delete(emailOrPhone);

    let user;
    const digitsOnly = emailOrPhone.replace(/\D/g, '');
    const cleanId = (digitsOnly.length >= 10) ? digitsOnly.slice(-10) : emailOrPhone;

    if (mongoose.connection.readyState !== 1) {
       if (mockAdminStore.hasOverride(cleanId)) {
          user = { id: 'admin_mock', name: 'Demo Admin', role: 'admin', phone: cleanId };
       } else {
          return res.status(403).json({ error: 'Database disconnected' });
       }
    } else {
       user = await User.findOne({ 
         $or: [
           { email: emailOrPhone }, 
           { phone: { $regex: cleanId + "$" } }
         ] 
       });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign({ id: user._id || 'admin_mock', role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful!', user: (user.toObject ? mapUser(user) : user), token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) return res.status(400).json({ error: 'Phone, OTP, and New Password required' });

    // Standard OTP Reset logic (Open to all registered users)

    const stored = otpStore.get(phone);
    if (!stored || stored.code !== code) {
       return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // In Limited Mode, we store the passcode in memory so the user can test the login
    const digitsOnly = phone.replace(/\D/g, '');
    const cleanId = (digitsOnly.length >= 10) ? digitsOnly.slice(-10) : phone;
    if (mongoose.connection.readyState !== 1) {
       mockAdminStore.setPasscode(cleanId, newPassword);
       otpStore.delete(phone);
       return res.json({ 
         message: 'Demo Mode: Passcode updated in memory for ' + cleanId + '. Use it to login now.',
         demo: true
       });
    }

    otpStore.delete(phone);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const user = await User.findOne({ phone: { $regex: cleanPhone + "$" } });
    if (!user) return res.status(404).json({ error: 'User not found with this authorized phone number' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successful! You can now login with your new password.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
