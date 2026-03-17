const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  stock: { type: Number, default: 0 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  specifications: { type: Map, of: String, default: {} },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 4.0 },
  sku: { type: String, default: '' }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('Product', productSchema);
