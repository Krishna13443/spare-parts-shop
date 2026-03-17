const express = require('express');
const router = express.Router();
const { ChallengeOrder } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

const mockChallenges = [
  { _id: 'c1', customerName: 'Workshop Alpha', total: 12000, status: 'Completed', createdAt: new Date() },
  { _id: 'c2', customerName: 'Service Gamma', total: 8500, status: 'In Progress', createdAt: new Date() }
];

// GET all challenge orders
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ orders: mockChallenges });
    }
    const orders = await ChallengeOrder.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create challenge order
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot save challenges in Preview Mode.' });
    }
    const order = await ChallengeOrder.create(req.body);
    res.status(201).json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update challenge order
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot update challenges in Preview Mode.' });
    }
    const order = await ChallengeOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE challenge order
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot delete challenges in Preview Mode.' });
    }
    const order = await ChallengeOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
