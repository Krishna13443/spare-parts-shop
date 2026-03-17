const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Category, Product } = require('../models');
const { mockCategories } = require('../utils/mock-data');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Serving mock categories (DB disconnected)');
      return res.json(mockCategories);
    }

    const categories = await Category.find().sort({ name: 1 });
    
    // Get product counts for each category
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);
    
    const countMap = categoryStats.reduce((acc, stat) => {
      if (stat._id) {
        acc[stat._id.toString()] = stat.count;
      }
      return acc;
    }, {});

    const result = categories.map(c => {
      const obj = c.toObject();
      obj.id = obj._id;
      obj.productCount = countMap[obj._id.toString()] || 0;
      return obj;
    });

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
