const express = require('express');
const router = express.Router();
const { Order, Product, Category } = require('../models');
const mongoose = require('mongoose');
const { mockAnalytics } = require('../utils/mock-data');

// GET /api/analytics/summary — Overall summary
router.get('/summary', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAnalytics.summary);
    }
    const [orders, products] = await Promise.all([
      Order.find(),
      Product.find()
    ]);

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    res.json({ totalRevenue, totalOrders, totalProducts, avgOrderValue, pendingOrders, deliveredOrders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/monthly — Monthly sales data for charts
router.get('/monthly', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAnalytics.monthly);
    }
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const orders = await Order.find().sort({ createdAt: 1 });

    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    months.forEach((m, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      monthlyData[key] = { month: m, year, orders: 0, revenue: 0, items: 0 };
    });

    orders.forEach(order => {
      const d = new Date(order.createdAt);
      if (d.getFullYear() !== year) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].orders += 1;
        monthlyData[key].revenue += order.total || 0;
        monthlyData[key].items += Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
      }
    });

    res.json(Object.values(monthlyData));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/daily — Daily sales
router.get('/daily', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAnalytics.daily || []);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const orders = await Order.find().sort({ createdAt: 1 });

    const dailyData = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyData[d] = { day: d, orders: 0, revenue: 0, items: 0 };
    }

    orders.forEach(order => {
      const dt = new Date(order.createdAt);
      if (dt.getFullYear() !== year || (dt.getMonth() + 1) !== month) return;
      const day = dt.getDate();
      if (dailyData[day]) {
        dailyData[day].orders += 1;
        dailyData[day].revenue += order.total || 0;
        dailyData[day].items += Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
      }
    });

    res.json(Object.values(dailyData));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/top-products
router.get('/top-products', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAnalytics.topProducts);
    }
    const orders = await Order.find();
    const productSales = {};

    orders.forEach(order => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity || 0;
        productSales[item.productId].revenue += item.subtotal || 0;
      });
    });

    const sorted = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    res.json(sorted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/category-sales
router.get('/category-sales', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAnalytics.categorySales);
    }
    const [orders, products] = await Promise.all([
      Order.find(),
      Product.find().populate('categoryId')
    ]);
    
    const productMap = {};
    products.forEach(p => { 
      if (p && p._id) {
        productMap[p._id.toString()] = p.categoryId ? (p.categoryId.name || 'Other') : 'Other'; 
      }
    });

    const categorySales = {};
    orders.forEach(order => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach(item => {
        const prodId = item.productId ? item.productId.toString() : 'unknown';
        const catName = productMap[prodId] || 'Other';
        if (!categorySales[catName]) categorySales[catName] = { category: catName, quantity: 0, revenue: 0 };
        categorySales[catName].quantity += item.quantity || 0;
        categorySales[catName].revenue += item.subtotal || 0;
      });
    });

    res.json(Object.values(categorySales));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/order-status
router.get('/order-status', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAnalytics.orderStatus || { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 });
    }
    const orders = await Order.find();
    const statusCounts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { 
      const s = o.status || 'Order Received';
      // Map multi-word to keys in statusCounts
      const keyMap = {
        'orderreceived': 'pending',
        'confirmed': 'confirmed',
        'processing': 'processing',
        'shipped': 'shipped',
        'outfordelivery': 'shipped', // Map to shipped for simplicity in summary
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'pending': 'pending'
      };
      const key = keyMap[s.toLowerCase().replace(/\s+/g, '')] || 'pending';
      if (statusCounts[key] !== undefined) statusCounts[key]++; 
    });
    res.json(statusCounts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/inventory
router.get('/inventory', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        totalValue: 580000,
        lowStockCount: 2,
        lowStockItems: [{ name: 'V6 5HP Motor', stock: 1, category: 'Motors' }],
        categoryDistribution: [{ name: 'Motors', value: 420000 }, { name: 'Wires', value: 160000 }]
      });
    }
    const products = await Product.find().populate('categoryId');
    
    let totalValue = 0;
    const lowStockItems = [];
    const categoryDistribution = {};

    products.forEach(p => {
      const val = p.price * p.stock;
      totalValue += val;

      if (p.stock <= 1) {
        lowStockItems.push({ id: p._id, name: p.name, stock: p.stock, category: p.categoryId ? p.categoryId.name : 'Other' });
      }

      const catName = p.categoryId ? p.categoryId.name : 'Other';
      if (!categoryDistribution[catName]) categoryDistribution[catName] = 0;
      categoryDistribution[catName] += val;
    });

    res.json({
      totalValue,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.sort((a,b) => a.stock - b.stock),
      categoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
