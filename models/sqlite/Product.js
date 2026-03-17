const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  price: { type: DataTypes.FLOAT, allowNull: false },
  originalPrice: { type: DataTypes.FLOAT, allowNull: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  categoryId: { type: DataTypes.UUID, allowNull: false },
  image: { type: DataTypes.STRING, defaultValue: '' },
  images: { type: DataTypes.JSON, defaultValue: [] },
  specifications: { type: DataTypes.JSON, defaultValue: {} },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 4.0 },
  sku: { type: DataTypes.STRING, defaultValue: '' },
});

module.exports = Product;
