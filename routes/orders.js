const express = require('express');
const router = express.Router();
const { Order, CartItem, Product, User } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const twilioService = require('../services/twilio');
const emailService = require('../services/email');
const { mockOrders } = require('../utils/mock-data');
const mongoose = require('mongoose');

// Mock in-memory orders for when DB is down
const memoryOrders = new Map(); // customId -> orderObject

// POST /api/orders — Place order
router.post('/', async (req, res) => {
  try {
    const { sessionId, customerName, customerEmail, customerPhone, shippingAddress, paymentMethod, userId, shopName, addressLines, city, pincode, landmark } = req.body;
    console.log('PLACE ORDER REQUEST:', { sessionId, customerName, customerPhone, itemsCount: req.body.items?.length });

    // Generate unique custom order ID: ORD + YEAR + 6 random digits
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000); // Always 6 digits
    const customId = `ORD${year}${random}`;

    // DB Down Fallback
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Processing mock order placement');
      const mockOrder = {
        id: customId,
        customId,
        customerName,
        customerPhone,
        total: 1000, // Dummy
        status: 'Order Received',
        paymentMethod: paymentMethod || 'cod',
        createdAt: new Date(),
        items: []
      };
      memoryOrders.set(customId.toUpperCase(), mockOrder);
      
      // Attempt SMS notify anyway
      twilioService.sendMessage(customerPhone, `Order SUCCESS! ID: ${customId}`).catch(() => {});

      return res.status(201).json(mockOrder);
    }

    // Comprehensive validation
    if (!sessionId) return res.status(400).json({ error: 'Session ID is missing. Please refresh the page.' });
    if (!customerName || customerName.trim().length < 3) return res.status(400).json({ error: 'Name must be at least 3 characters' });
    if (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone.trim())) return res.status(400).json({ error: 'Valid 10-digit Indian mobile number required' });
    if (!shopName) return res.status(400).json({ error: 'Shop Name is required' });
    if (!addressLines) return res.status(400).json({ error: 'Shop Address is required' });
    if (!city) return res.status(400).json({ error: 'City is required' });
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ error: 'Valid 6-digit pincode required' });

    // Get cart items
    const cartItems = await CartItem.find({ sessionId }).populate('productId');
    console.log(`Found ${cartItems.length} items for session ${sessionId}`);
    const validCartItems = cartItems.filter(ci => ci.productId);
    
    if (validCartItems.length === 0) {
      if (cartItems.length > 0) await CartItem.deleteMany({ sessionId });
      return res.status(400).json({ error: 'Items are no longer available. Cart cleared.' });
    }

    const items = validCartItems.map(ci => ({
      productId: ci.productId._id,
      name: ci.productId.name,
      price: ci.productId.price,
      quantity: ci.quantity,
      subtotal: ci.productId.price * ci.quantity,
    }));
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    // Verify user exists if userId is provided
    let authenticatedUserId = null;
    if (userId && userId.length === 24) { // Basic check for ObjectID length
      const userExists = await User.findById(userId);
      if (userExists) authenticatedUserId = userId;
    }

    const order = new Order({
      userId: authenticatedUserId,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      customId,
      items,
      total,
      shippingAddress,
      shopName, addressLines, city, pincode, landmark,
      paymentMethod: paymentMethod || 'cod',
      status: 'Order Received',
    });

    await order.save();

    // Update stock using valid items
    for (const ci of validCartItems) {
      if (ci.productId && ci.productId._id) {
        const newStock = Math.max(0, (ci.productId.stock || 0) - ci.quantity);
        await Product.findByIdAndUpdate(ci.productId._id, { stock: newStock });
      }
    }

    // Clear cart (the whole session cart)
    await CartItem.deleteMany({ sessionId });

    // Send confirmation notifications (Asyncly, don't block response)
    try {
      const msg = `Order placed successfully! Your Tracking ID is: ${customId}. Track at SparkMotors website.`;
      twilioService.sendMessage(customerPhone, msg).catch(e => console.error('Notify SMS failed:', e.message));
      if (customerEmail) {
        emailService.sendOrderConfirmation(customerEmail, customId, customerName).catch(e => console.error('Notify Email failed:', e.message));
      }
    } catch (nErr) { console.error('Notification trigger error:', nErr.message); }

    const obj = order.toObject();
    obj.id = obj.customId || obj._id;
    res.status(201).json(obj);
  } catch (err) { 
    console.error('PLACE ORDER ERROR:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// GET /api/orders — List orders (Admin or User's own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Serving mock orders listing');
      return res.json({ 
        orders: Array.from(memoryOrders.values()).concat(mockOrders || []), 
        total: memoryOrders.size + (mockOrders ? mockOrders.length : 0), 
        page: 1, 
        totalPages: 1 
      });
    }

    const { page = 1, limit = 20, status, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    // If not admin, only show own orders
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip),
      Order.countDocuments(query)
    ]);

    const mappedOrders = orders.map(o => {
      const obj = o.toObject();
      obj.id = obj.customId || obj._id;
      return obj;
    });

    res.json({ 
      orders: mappedOrders, 
      total, 
      page: parseInt(page), 
      totalPages: Math.ceil(total / parseInt(limit)) 
    });
  } catch (err) { 
    console.error('LIST ORDERS ERROR:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const order = Array.from(memoryOrders.values()).concat(mockOrders || []).find(o => o.id === req.params.id || o.customId === req.params.id);
      if (!order) return res.status(404).json({ error: 'Order not found (Preview Mode)' });
      return res.json(order);
    }
    let order = await Order.findOne({ customId: req.params.id });
    if (!order && req.params.id.length === 24) {
      order = await Order.findById(req.params.id);
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Check if admin or owner
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && order.userId && order.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const obj = order.toObject();
    obj.id = obj.customId || obj._id;
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/orders/:id — Update status (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const lookupId = req.params.id;

    if (mongoose.connection.readyState !== 1) {
      const order = memoryOrders.get(lookupId.toUpperCase()) || (mockOrders || []).find(o => o.id === lookupId);
      if (order) {
        order.status = req.body.status;
        return res.json(order);
      }
      return res.status(404).json({ error: 'Order not found (Preview mode)' });
    }

    let order = await Order.findOne({ customId: { $regex: new RegExp(`^${lookupId}$`, 'i') } });
    if (!order && lookupId.length === 24) {
      order = await Order.findById(lookupId);
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (req.body.status) order.status = req.body.status;
    await order.save();

    const obj = order.toObject();
    obj.id = obj.customId || obj._id;
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/orders/all (Admin only)
router.delete('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Order.deleteMany({});
    res.json({ message: 'All sales data cleared successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/orders/track/:id — Public tracking without login
router.get('/track/:id', async (req, res) => {
  try {
    const lookupId = req.params.id;

    if (mongoose.connection.readyState !== 1) {
      const order = memoryOrders.get(lookupId.toUpperCase());
      if (order) return res.json(order);
      return res.status(404).json({ error: 'Order not found (Preview mode)' });
    }

    // Search by customId (case-insensitive) OR MongoDB _id
    let order = await Order.findOne({ customId: { $regex: new RegExp(`^${lookupId}$`, 'i') } });
    if (!order && lookupId.length === 24) {
      order = await Order.findById(lookupId);
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // We only return public tracking info to avoid leaking too much
    const obj = order.toObject();
    obj.id = obj.customId || obj._id;
    res.json(obj);
  } catch (err) { res.status(500).json({ error: 'Invalid Order ID' }); }
});

// PUT /api/orders/track/:id — Public cancellation (if "Order Received")
router.put('/track/:id', async (req, res) => {
  try {
    const lookupId = req.params.id;
    if (mongoose.connection.readyState !== 1) {
      const order = memoryOrders.get(lookupId.toUpperCase());
      if (!order) return res.status(404).json({ error: 'Order not found (Preview mode)' });
      if (req.body.status === 'Cancelled') {
         order.status = 'Cancelled';
         return res.json(order);
      }
      return res.json(order);
    }
    let order = await Order.findOne({ customId: { $regex: new RegExp(`^${lookupId}$`, 'i') } });
    if (!order && lookupId.length === 24) {
      order = await Order.findById(lookupId);
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Allow cancellation only if Order Received
    if (order.status !== 'Order Received' && req.body.status === 'Cancelled') {
        return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    if (req.body.status === 'Cancelled') {
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      }
      order.status = 'Cancelled';
      await order.save();
    }
    
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
