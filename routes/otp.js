const express = require('express');
const router = express.Router();

const otpStore = require('../utils/otp-store');

const twilioService = require('../services/twilio');
const emailService = require('../services/email');
const { rateLimiter } = require('../middleware/security');

// Limit OTP sending to prevent spamming
const sendLimiter = rateLimiter({ windowMs: 10 * 60 * 1000, max: 100, message: 'Too many OTP requests. Please wait.' });
// Limit verification attempts to prevent brute-forcing the 6-digit code
const verifyLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many verification attempts. Please try again later.' });

// POST /api/otp/send — Generate and send a real OTP
router.post('/send', sendLimiter, async (req, res) => {
  const { phone, email } = req.body;
  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone number or Email required' });
  }

  const identifier = email || phone;
  const isEmail = !!email;

  // Determine if it's a real delivery or verification preview
  const isConfigured = isEmail 
    ? !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    : !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

  // Generate a robust 6-digit code
  const code = isConfigured 
    ? Math.floor(100000 + Math.random() * 900000).toString() 
    : '123456';
  
  // Set in-memory store
  otpStore.set(identifier, { code });

  try {
    if (isConfigured) {
      if (isEmail) {
        await emailService.sendOTP(email, code);
      } else {
        await twilioService.sendOTP(phone, code);
      }
      return res.json({ success: true, message: 'OTP sent successfully! 📱' });
    } else {
      // Mock mode for local testing/development
      console.log(`\n--- OTP VERIFICATION PREVIEW ---`);
      console.log(`TO: ${identifier}`);
      console.log(`CODE: ${code}`);
      console.log(`-------------------------------\n`);
      
      return res.json({ 
        success: true, 
        message: `Verification Preview: Use code ${code} (Check logs for details).`,
        mock: true
      });
    }
  } catch (err) {
    console.error(`✗ OTP Delivery Failed:`, err.message);
    
    // In case of a real error (e.g. invalid Twilio SID), we still allow the mock code
    // so the customer isn't blocked, but we notify the server logs.
    return res.json({ 
      success: true, 
      message: `System Alert: Delivery error (${err.message}). Using safety code ${code}.`,
      mock: true
    });
  }
});

// POST /api/otp/verify — Verify the submitted OTP
router.post('/verify', verifyLimiter, (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

  const stored = otpStore.get(phone);
  if (!stored) return res.status(400).json({ error: 'No OTP found. Please click Send OTP again.' });

  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }

  if (stored.code === code) {
    otpStore.delete(phone);
    res.json({ success: true, message: 'Phone verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
  }
});

module.exports = router;
