const express = require('express');
const router = express.Router();
const { Widget } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

const mockWidgets = [
  { id: 'w1', title: 'Revenue Trend', type: 'Line chart', width: 8, height: 6, position: 0 },
  { id: 'w2', title: 'Total Orders', type: 'KPI', width: 4, height: 3, position: 1 },
  { id: 'w3', title: 'Average Order Value', type: 'KPI', width: 4, height: 3, position: 2 }
];

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ widgets: mockWidgets });
    }
    const widgets = await Widget.find().sort({ createdAt: 1 });
    res.json({ widgets });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot create widgets in Preview Mode.' });
    }
    const widget = await Widget.create(req.body);
    res.status(201).json(widget);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot update widgets in Preview Mode.' });
    }
    const widget = await Widget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!widget) return res.status(404).json({ error: 'Widget not found' });
    res.json(widget);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot delete widgets in Preview Mode.' });
    }
    await Widget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Widget deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
