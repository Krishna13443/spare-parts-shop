const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, defaultValue: '' },
  role: { type: DataTypes.ENUM('customer', 'admin', 'staff'), defaultValue: 'customer' },
  shopName: { type: DataTypes.STRING, defaultValue: '' },
  addressLines: { type: DataTypes.TEXT, defaultValue: '' },
  city: { type: DataTypes.STRING, defaultValue: '' },
  pincode: { type: DataTypes.STRING, defaultValue: '' },
  landmark: { type: DataTypes.STRING, defaultValue: '' }
});

module.exports = User;
