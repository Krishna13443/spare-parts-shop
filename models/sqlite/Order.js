const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerEmail: { type: DataTypes.STRING, defaultValue: '' },
  customerPhone: { type: DataTypes.STRING, defaultValue: '' },
  items: { type: DataTypes.JSON, defaultValue: [] },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'), defaultValue: 'pending' },
  shippingAddress: { type: DataTypes.TEXT, defaultValue: '' },
  shopName: { type: DataTypes.STRING, defaultValue: '' },
  addressLines: { type: DataTypes.TEXT, defaultValue: '' },
  city: { type: DataTypes.STRING, defaultValue: '' },
  pincode: { type: DataTypes.STRING, defaultValue: '' },
  landmark: { type: DataTypes.STRING, defaultValue: '' },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'cod' },
});

module.exports = Order;
