const mongoose = require('mongoose');

const challengeOrderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  emailId: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  stateProvince: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true, default: 'Pending' },
  createdBy: { type: String, required: true }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('ChallengeOrder', challengeOrderSchema);
