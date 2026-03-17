const mockCategories = [
  { _id: 'cat_motors', name: 'Submersible Motors', description: 'High-performance submersible pump motors', icon: '⚡', id: 'cat_motors' },
  { _id: 'cat_wires', name: 'Copper Winding Wire', description: 'Premium grade copper winding wires', icon: '🟤', id: 'cat_wires' },
  { _id: 'cat_capacitors', name: 'Capacitors', description: 'Motor start and run capacitors', icon: '🔋', id: 'cat_capacitors' },
  { _id: 'cat_acc', name: 'Pump Accessories', description: 'Impellers, seals, and mechanical parts', icon: '🔧', id: 'cat_acc' },
  { _id: 'cat_panels', name: 'Control Panels', description: 'Starter panels and protection devices', icon: '🎛️', id: 'cat_panels' },
  { _id: 'cat_pipes', name: 'Pipes & Fittings', description: 'Drop pipes and connectors', icon: '🔩', id: 'cat_pipes' }
];

const mockProducts = [
  {
    _id: 'p_v4_15', id: 'p_v4_15', sku: 'SM-V4-15HP',
    name: 'V4 Submersible Motor 1.5 HP',
    description: 'High-efficiency V4 submersible motor designed for 4-inch borewells.',
    price: 4500, originalPrice: 5200, stock: 25,
    categoryId: mockCategories[0], category: mockCategories[0],
    image: 'https://images.unsplash.com/photo-1617469165786-8007eda3caa7?w=400&q=80',
    featured: true, rating: 4.5,
    specifications: { hp: '1.5 HP', voltage: '220V', phase: 'Single Phase', size: '4 inch (V4)' }
  },
  {
    _id: 'p_v4_3', id: 'p_v4_3', sku: 'SM-V4-3HP',
    name: 'V4 Submersible Motor 3 HP',
    description: 'Powerful 3 HP V4 submersible motor for deep borewell applications.',
    price: 7800, originalPrice: 8500, stock: 18,
    categoryId: mockCategories[0], category: mockCategories[0],
    image: 'https://images.unsplash.com/photo-1590483734731-155e9668469d?w=400&q=80',
    featured: true, rating: 4.7,
    specifications: { hp: '3 HP', voltage: '220V', phase: 'Single Phase', size: '4 inch (V4)' }
  },
  {
    _id: 'p_v6_5', id: 'p_v6_5', sku: 'SM-V6-5HP',
    name: 'V6 Submersible Motor 5 HP',
    description: 'Industrial-grade V6 submersible motor for commercial water supply.',
    price: 14500, originalPrice: 16000, stock: 10,
    categoryId: mockCategories[0], category: mockCategories[0],
    image: 'https://images.unsplash.com/photo-1621905252507-b35482cd84b0?w=400&q=80',
    featured: true, rating: 4.8,
    specifications: { hp: '5 HP', voltage: '415V', phase: 'Three Phase', size: '6 inch (V6)' }
  },
  {
    _id: 'p_cw_18', id: 'p_cw_18', sku: 'CW-18SWG-1KG',
    name: 'Copper Winding Wire 18 SWG — 1kg',
    description: 'Premium enamelled copper winding wire, 18 SWG gauge.',
    price: 950, originalPrice: 1100, stock: 100,
    categoryId: mockCategories[1], category: mockCategories[1],
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100dc?w=400&q=80',
    featured: true, rating: 4.4,
    specifications: { gauge: '18 SWG', weight: '1 kg', purity: '99.9% Copper' }
  },
  {
    _id: 'p_cap_150', id: 'p_cap_150', sku: 'CAP-START-150',
    name: 'Motor Start Capacitor 150µF',
    description: 'High-quality motor start capacitor for submersible motors.',
    price: 280, originalPrice: 350, stock: 200,
    categoryId: mockCategories[2], category: mockCategories[2],
    image: 'https://images.unsplash.com/photo-1590674872081-42021516ebcd?w=400&q=80',
    featured: false, rating: 4.1,
    specifications: { capacitance: '150 µF', voltage: '250V AC' }
  },
  {
    _id: 'p_acc_seal', id: 'p_acc_seal', sku: 'PA-SEAL-22',
    name: 'Mechanical Seal 22mm',
    description: 'Premium mechanical shaft seal for submersible pumps.',
    price: 380, originalPrice: 450, stock: 120,
    categoryId: mockCategories[3], category: mockCategories[3],
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80',
    featured: true, rating: 4.4,
    specifications: { size: '22mm', material: 'SiC/Carbon' }
  },
  {
    _id: 'p_pan_dol', id: 'p_pan_dol', sku: 'CP-DOL-3HP',
    name: 'DOL Starter Panel 3 HP',
    description: 'Direct On-Line starter panel with overload protection.',
    price: 2400, originalPrice: 2800, stock: 20,
    categoryId: mockCategories[4], category: mockCategories[4],
    image: 'https://images.unsplash.com/photo-1558449028-c44d7e10816a?w=400&q=80',
    featured: true, rating: 4.6,
    specifications: { type: 'DOL Starter', hp: '3 HP', phase: 'Single Phase' }
  },
  {
    _id: 'p_pf_nrv', id: 'p_pf_nrv', sku: 'PF-NRV-2-BR',
    name: 'Non-Return Valve 2\" Brass',
    description: 'Heavy-duty brass valve to prevent backflow in installations.',
    price: 550, originalPrice: 650, stock: 70,
    categoryId: mockCategories[5], category: mockCategories[5],
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
    featured: false, rating: 4.2,
    specifications: { material: 'Brass', size: '2 inch' }
  }
];

const mockOrders = [
  { id: 'ORD2026123456', customId: 'ORD2026123456', customerName: 'Ramesh Kumar', customerPhone: '9845012345', total: 18500, status: 'Delivered', paymentMethod: 'upi', createdAt: new Date('2026-03-01'), items: [{ name: 'V6 5HP Motor', quantity: 1, subtotal: 18500, price: 18500 }] },
  { id: 'ORD2026789012', customId: 'ORD2026789012', customerName: 'Suresh Raina', customerPhone: '9080799320', total: 24800, status: 'Order Received', paymentMethod: 'cod', createdAt: new Date('2026-03-15'), items: [{ name: 'V4 3HP Motor', quantity: 2, subtotal: 24800, price: 12400 }] },
  { id: 'ORD2026345678', customId: 'ORD2026345678', customerName: 'Anitha Sharma', customerPhone: '9988776655', total: 1700, status: 'Shipped', paymentMethod: 'bank_transfer', createdAt: new Date('2026-03-10'), items: [{ name: '22 Gauge Copper Wire', quantity: 2, subtotal: 1700, price: 850 }] },
  { id: 'ORD2026112233', customId: 'ORD2026112233', customerName: 'Krishna (Admin)', customerPhone: '9080799320', total: 4500, status: 'Processing', paymentMethod: 'cod', createdAt: new Date('2026-03-16'), items: [{ name: 'V4 Submersible Motor 1.5 HP', quantity: 1, subtotal: 4500, price: 4500 }] }
];

const mockAnalytics = {
  summary: { totalRevenue: 49500, totalOrders: 4, totalProducts: 8, avgOrderValue: 12375, pendingOrders: 2, deliveredOrders: 1 },
  monthly: [
    { month: 'Jan', year: 2026, orders: 12, revenue: 125000, items: 45 },
    { month: 'Feb', year: 2026, orders: 18, revenue: 210000, items: 62 },
    { month: 'Mar', year: 2026, orders: 35, revenue: 495000, items: 112 }
  ],
  daily: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, orders: Math.floor(Math.random() * 5), revenue: Math.floor(Math.random() * 5000) })),
  orderStatus: { pending: 5, confirmed: 2, processing: 3, shipped: 1, delivered: 10, cancelled: 1 },
  topProducts: [
    { name: 'V6 5HP Motor', quantity: 12, revenue: 222000 },
    { name: 'V4 3HP Motor', quantity: 15, revenue: 186000 },
    { name: 'Copper Winding Wire 18 SWG', quantity: 45, revenue: 42750 }
  ],
  categorySales: [
    { category: 'Motors', quantity: 27, revenue: 408000 },
    { category: 'Wires', quantity: 45, revenue: 42750 },
    { category: 'Accessories', quantity: 15, revenue: 5700 }
  ]
};

module.exports = {
  mockCategories,
  mockProducts,
  mockOrders,
  mockAnalytics
};
