const rateLimitMap = new Map();

/**
 * Simple In-Memory Rate Limiter for secure routes
 * Prevents DDoS and brute-force attacks by limiting requests per IP
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes window
    max = 5,                  // limit each IP to 5 requests per windowMs
    message = 'Too many attempts, please try again later.'
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const rateData = rateLimitMap.get(ip);

    if (now > rateData.resetTime) {
      // Window expired, reset
      rateData.count = 1;
      rateData.resetTime = now + windowMs;
      return next();
    }

    rateData.count++;

    if (rateData.count > max) {
      console.warn(`[SECURITY] Blocked request from IP: ${ip} (Exceeded limit: ${max})`);
      return res.status(429).json({ 
        error: message,
        retryAfter: Math.ceil((rateData.resetTime - now) / 1000)
      });
    }

    next();
  };
};

module.exports = { rateLimiter };
