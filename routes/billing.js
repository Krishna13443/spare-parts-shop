const express = require('express');
const router = express.Router();
const { Order, Product } = require('../models');
const mongoose = require('mongoose');

// POST /api/billing/save — Direct billing (quick sale)
router.post('/save', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot save invoices in Preview Mode.' });
    }
    const { items, customerName, customerPhone, customerEmail, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must have at least one item' });
    }

    const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    // Create the order
    const order = await Order.create({
      customerName: customerName || 'In-Store Customer',
      customerPhone: customerPhone || '9999999999',
      customerEmail: customerEmail || '',
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.qty,
        subtotal: i.price * i.qty
      })),
      total,
      status: 'delivered', // Billing system orders are usually immediate sales
      paymentMethod: paymentMethod || 'cash',
      shopName: 'SparkMotors (In-Store)',
      addressLines: 'In-Store Sale',
      city: 'Local',
      pincode: '000000',
      landmark: 'Store Front'
    });

    // Update stock for each product
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
      }
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
