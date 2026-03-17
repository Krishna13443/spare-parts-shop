const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer' },
  // Profile fields
  shopName: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  bio: { type: String, default: '' },
  addressLines: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  landmark: { type: String, default: '' }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('User', userSchema);
