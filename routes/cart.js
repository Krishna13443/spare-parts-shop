const express = require('express');
const router = express.Router();
const { CartItem, Product, Category } = require('../models');
const mongoose = require('mongoose');
const { mockProducts } = require('../utils/mock-data');

// Mock in-memory cart for when DB is down
const memoryCart = new Map(); // sessionId -> array of {id, productId, quantity}

// GET /api/cart?sessionId=xxx
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    
    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Serving in-memory cart');
      const items = memoryCart.get(sessionId) || [];
      const mappedItems = items.map(item => {
        const p = mockProducts.find(x => x.id === item.productId);
        return {
          id: item.id,
          productId: p,
          product: p,
          quantity: item.quantity
        };
      });
      const total = mappedItems.reduce((sum, item) => sum + (item.product ? item.product.price * item.quantity : 0), 0);
      return res.json({ items: mappedItems, total, count: mappedItems.length });
    }

    const items = await CartItem.find({ sessionId })
      .populate({
        path: 'productId',
        populate: { path: 'categoryId', select: 'name icon' }
      });

    const total = items.reduce((sum, item) => sum + (item.productId ? item.productId.price * item.quantity : 0), 0);
    
    // Map _id to id and productId to product for compatibility
    const mappedItems = items.map(item => {
      const obj = item.toObject();
      obj.id = obj._id;
      obj.product = obj.productId;
      if (obj.product) {
        obj.product.id = obj.product._id || null;
        obj.product.category = obj.product.categoryId;
      }
      return obj;
    });

    res.json({ items: mappedItems, total, count: items.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/cart — Add item
router.post('/', async (req, res) => {
  try {
    const { sessionId, productId, quantity = 1 } = req.body;
    if (!sessionId || !productId) return res.status(400).json({ error: 'sessionId and productId required' });
    
    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      let items = memoryCart.get(sessionId) || [];
      let existing = items.find(i => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        existing = { id: Date.now().toString(), productId, quantity };
        items.push(existing);
      }
      memoryCart.set(sessionId, items);
      return res.json(existing);
    }

    let existing = await CartItem.findOne({ sessionId, productId });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      res.json(existing);
    } else {
      const item = await CartItem.create({ sessionId, productId, quantity });
      res.status(201).json(item);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/cart/:id — Update quantity
router.put('/:id', async (req, res) => {
  try {
    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      for (const [sid, items] of memoryCart.entries()) {
        const item = items.find(i => i.id === req.params.id);
        if (item) {
          item.quantity = req.body.quantity;
          return res.json(item);
        }
      }
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const item = await CartItem.findByIdAndUpdate(req.params.id, { quantity: req.body.quantity }, { new: true });
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res) => {
  try {
    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      for (const [sid, items] of memoryCart.entries()) {
        const idx = items.findIndex(i => i.id === req.params.id);
        if (idx > -1) {
          items.splice(idx, 1);
          return res.json({ message: 'Item removed' });
        }
      }
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const item = await CartItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ message: 'Item removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/cart/clear/:sessionId — Clear cart
router.delete('/clear/:sessionId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      memoryCart.delete(req.params.sessionId);
      return res.json({ message: 'Cart cleared' });
    }
    await CartItem.deleteMany({ sessionId: req.params.sessionId });
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
