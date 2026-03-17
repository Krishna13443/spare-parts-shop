const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('CartItem', cartItemSchema);
