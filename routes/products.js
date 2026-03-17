const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const mongoose = require('mongoose');
const { mockProducts } = require('../utils/mock-data');

// GET /api/products — List products with filters
router.get('/', async (req, res) => {
  try {
    // If DB is disconnected, return mock data immediately
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Serving mock products (DB disconnected)');
      return res.json({ 
        products: mockProducts, 
        total: mockProducts.length, 
        page: 1, 
        totalPages: 1 
      });
    }

    const { page = 1, limit = 20, category, search, featured, sort = 'createdAt', order = 'DESC', minPrice, maxPrice } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (category) query.categoryId = category;
    if (featured === 'true') query.featured = true;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sortOrder = order.toLowerCase() === 'desc' ? -1 : 1;
    const sortField = sort === 'createdAt' ? '_id' : sort; // Simple mapping

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name icon')
        .sort({ [sortField]: sortOrder })
        .limit(parseInt(limit))
        .skip(skip),
      Product.countDocuments(query)
    ]);

    // Map `categoryId` to `category` for frontend compatibility
    const mappedProducts = products.map(p => {
      const obj = p.toObject();
      obj.category = obj.categoryId;
      obj.id = obj._id; // Frontend expects `id`
      return obj;
    });

    res.json({ 
      products: mappedProducts, 
      total, 
      page: parseInt(page), 
      totalPages: Math.ceil(total / parseInt(limit)) 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const p = mockProducts.find(x => x.id === req.params.id);
      if (!p) return res.status(404).json({ error: 'Product not found (Mock)' });
      return res.json(p);
    }
    const product = await Product.findById(req.params.id).populate('categoryId');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const obj = product.toObject();
    obj.category = obj.categoryId;
    obj.id = obj._id;
    
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const multer = require('multer');
const { uploadImage } = require('../services/cloudinary');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// POST /api/products (admin)
router.post('/', upload.single('imageFile'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot save products in Preview Mode.' });
    }
    let data = { ...req.body };
    
    if (typeof data.specifications === 'string') data.specifications = JSON.parse(data.specifications);
    if (typeof data.images === 'string') data.images = JSON.parse(data.images);

    if (req.file) {
      const imageUrl = await uploadImage(req.file.path);
      data.image = imageUrl;
      if (!data.images) data.images = [];
      data.images.push(imageUrl);
      fs.unlinkSync(req.file.path);
    }
    
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/products/:id (admin)
router.put('/:id', upload.single('imageFile'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot update products in Preview Mode.' });
    }
    let data = { ...req.body };
    
    if (typeof data.specifications === 'string') data.specifications = JSON.parse(data.specifications);
    if (typeof data.images === 'string') data.images = JSON.parse(data.images);

    if (req.file) {
      const imageUrl = await uploadImage(req.file.path);
      data.image = imageUrl;
      // Note: In Mongo we might want to append to images array or replace
      // For now, let's just get the existing product to handle images array correctly
      const existing = await Product.findById(req.params.id);
      if (existing) {
        if (!data.images) data.images = existing.images || [];
        data.images.push(imageUrl);
      }
      fs.unlinkSync(req.file.path);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected. Cannot delete products in Preview Mode.' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
