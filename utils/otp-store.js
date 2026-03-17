const otpStore = new Map();

module.exports = {
  set: (key, val) => otpStore.set(key, { ...val, expires: Date.now() + 5 * 60 * 1000 }),
  get: (key) => {
    const stored = otpStore.get(key);
    if (!stored) return null;
    if (Date.now() > stored.expires) {
      otpStore.delete(key);
      return null;
    }
    return stored;
  },
  delete: (key) => otpStore.delete(key),
  store: otpStore // Direct access if needed
};
