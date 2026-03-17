try {
  const { mockOrders } = require('./utils/mock-data');
  const memoryOrders = new Map();
  const orders = Array.from(memoryOrders.values()).concat(mockOrders);
  console.log('Orders length:', orders.length);
  process.exit(0);
} catch (err) {
  console.error('ERROR:', err);
  process.exit(1);
}
