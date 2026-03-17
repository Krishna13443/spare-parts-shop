const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  customId: { type: String, unique: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
      subtotal: Number
    }
  ],
  total: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Order Received', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'pending', 'confirmed'], 
    default: 'Order Received' 
  },
  shippingAddress: { type: String, default: '' },
  shopName: { type: String, default: '' },
  addressLines: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  landmark: { type: String, default: '' },
  paymentMethod: { type: String, default: 'cod' }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('Order', orderSchema);
