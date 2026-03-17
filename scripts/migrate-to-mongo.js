const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Mongoose Models
const MongoModels = require('../models');
const connectMongo = require('../db/mongodb');

// Legacy SQLite Models
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

const defineSQLiteModels = (sequelize) => {
  const Category = sequelize.define('Category', {
    name: { type: Sequelize.STRING, unique: true },
    description: Sequelize.STRING,
    icon: Sequelize.STRING
  });

  const Product = sequelize.define('Product', {
    name: Sequelize.STRING,
    description: Sequelize.TEXT,
    price: Sequelize.FLOAT,
    stock: Sequelize.INTEGER,
    categoryId: Sequelize.INTEGER,
    image: Sequelize.STRING,
    images: Sequelize.JSON,
    specifications: Sequelize.JSON,
    featured: Sequelize.BOOLEAN,
    sku: Sequelize.STRING
  });

  const User = sequelize.define('User', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    phone: Sequelize.STRING,
    role: Sequelize.STRING,
    shopName: Sequelize.STRING,
    addressLines: Sequelize.STRING,
    city: Sequelize.STRING,
    pincode: Sequelize.STRING,
    landmark: Sequelize.STRING
  });

  const Order = sequelize.define('Order', {
    userId: Sequelize.INTEGER,
    customerName: Sequelize.STRING,
    customerEmail: Sequelize.STRING,
    customerPhone: Sequelize.STRING,
    items: Sequelize.JSON,
    total: Sequelize.FLOAT,
    status: Sequelize.STRING,
    shopName: Sequelize.STRING,
    addressLines: Sequelize.STRING,
    city: Sequelize.STRING,
    pincode: Sequelize.STRING,
    landmark: Sequelize.STRING,
    paymentMethod: Sequelize.STRING
  });

  const CartItem = sequelize.define('CartItem', {
    sessionId: Sequelize.STRING,
    productId: Sequelize.INTEGER,
    quantity: Sequelize.INTEGER
  });

  return { Category, Product, User, Order, CartItem };
};

const SQLite = defineSQLiteModels(sequelize);

const migrate = async () => {
  try {
    await connectMongo();
    console.log('--- Starting Migration ---');

    // 1. Categories
    console.log('Migrating Categories...');
    const oldCats = await SQLite.Category.findAll();
    const catMap = {}; // oldId -> newId
    
    for (const cat of oldCats) {
      const newCat = await MongoModels.Category.findOneAndUpdate(
        { name: cat.name },
        { description: cat.description, icon: cat.icon },
        { upsert: true, new: true }
      );
      catMap[cat.id] = newCat._id;
    }
    console.log(`✓ ${oldCats.length} Categories migrated.`);

    // 2. Users
    console.log('Migrating Users...');
    const oldUsers = await SQLite.User.findAll();
    const userMap = {};
    for (const user of oldUsers) {
      const newUser = await MongoModels.User.findOneAndUpdate(
        { email: user.email },
        { 
          name: user.name, 
          password: user.password, 
          phone: user.phone, 
          role: user.role, 
          shopName: user.shopName, 
          addressLines: user.addressLines, 
          city: user.city, 
          pincode: user.pincode, 
          landmark: user.landmark 
        },
        { upsert: true, new: true }
      );
      userMap[user.id] = newUser._id;
    }
    console.log(`✓ ${oldUsers.length} Users migrated.`);

    // 3. Products
    console.log('Migrating Products...');
    const oldProds = await SQLite.Product.findAll();
    const prodMap = {};
    for (const prod of oldProds) {
      const newProd = await MongoModels.Product.findOneAndUpdate(
        { name: prod.name, categoryId: catMap[prod.categoryId] },
        { 
          description: prod.description, 
          price: prod.price, 
          stock: prod.stock, 
          image: prod.image, 
          images: prod.images, 
          specifications: prod.specifications, 
          featured: prod.featured, 
          sku: prod.sku 
        },
        { upsert: true, new: true }
      );
      prodMap[prod.id] = newProd._id;
    }
    console.log(`✓ ${oldProds.length} Products migrated.`);

    // 4. Orders
    console.log('Migrating Orders...');
    const oldOrders = await SQLite.Order.findAll();
    for (const order of oldOrders) {
      const mappedItems = Array.isArray(order.items) ? order.items.map(item => ({
        ...item,
        productId: prodMap[item.productId] || null
      })) : [];

      await MongoModels.Order.create({
        userId: userMap[order.userId] || null,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: mappedItems,
        total: order.total,
        status: order.status,
        shopName: order.shopName,
        addressLines: order.addressLines,
        city: order.city,
        pincode: order.pincode,
        landmark: order.landmark,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      });
    }
    console.log(`✓ ${oldOrders.length} Orders migrated.`);

    console.log('--- Migration Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
