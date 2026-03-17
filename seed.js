const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Category, Product, User } = require('./models');
const connectDB = require('./db/mongodb');

async function seed() {
  await connectDB();
  console.log('✓ Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  console.log('✓ Cleared existing data');

  // Create admin user
  // Create admin user
  const hashedPassword = await bcrypt.hash('krishna1110', 10);
  const admin = await User.create({
    name: 'Krishna (Admin)',
    username: 'admin',
    email: 'college1110kj@gmail.com',
    password: hashedPassword,
    phone: '9080799320',
    role: 'admin',
  });
  console.log('✓ Admin user created (User ID: admin / Password: krishna1110 / Phone: 9080799320)');

  // Create categories
  const categoriesList = [
    { name: 'Submersible Motors', description: 'High-performance submersible pump motors for borewells and deep wells', icon: '⚡' },
    { name: 'Copper Winding Wire', description: 'Premium grade copper winding wires for motor rewinding', icon: '🟤' },
    { name: 'Capacitors', description: 'Motor start and run capacitors for reliable operation', icon: '🔋' },
    { name: 'Pump Accessories', description: 'Impellers, shaft seals, bearings, and mechanical parts', icon: '🔧' },
    { name: 'Control Panels', description: 'Starter panels, DOL starters, and motor protection devices', icon: '🎛️' },
    { name: 'Pipes & Fittings', description: 'Drop pipes, risers, connectors, and pipe fittings', icon: '🔩' },
  ];

  const categories = await Category.create(categoriesList);
  console.log('✓ Categories created');

  const [motors, copper, capacitors, pumpAcc, panels, pipes] = categories;

  // Create products
  const productsList = [
    // Submersible Motors
    {
      name: 'V4 Submersible Motor 1.5 HP',
      description: 'High-efficiency V4 submersible motor designed for 4-inch borewells. Oil-filled, water-cooled design ensures long service life. Suitable for domestic and agricultural applications.',
      price: 4500,
      originalPrice: 5200,
      stock: 25,
      categoryId: motors._id,
      image: '',
      specifications: { hp: '1.5 HP', voltage: '220V', phase: 'Single Phase', size: '4 inch (V4)', rpm: '2880', 'water_outlet': '1.25 inch' },
      featured: true,
      rating: 4.5,
      sku: 'SM-V4-15HP',
    },
    {
      name: 'V4 Submersible Motor 3 HP',
      description: 'Powerful 3 HP V4 submersible motor for deep borewell applications. Premium copper winding, SS shaft, and double mechanical seal for maximum efficiency.',
      price: 7800,
      originalPrice: 8500,
      stock: 18,
      categoryId: motors._id,
      image: '',
      specifications: { hp: '3 HP', voltage: '220V', phase: 'Single Phase', size: '4 inch (V4)', rpm: '2880', 'water_outlet': '2 inch' },
      featured: true,
      rating: 4.7,
      sku: 'SM-V4-3HP',
    },
    {
      name: 'V6 Submersible Motor 5 HP',
      description: 'Industrial-grade V6 submersible motor, 5 HP three-phase motor ideal for large borewells and commercial water supply. Robust stainless steel construction.',
      price: 14500,
      originalPrice: 16000,
      stock: 10,
      categoryId: motors._id,
      image: '',
      specifications: { hp: '5 HP', voltage: '415V', phase: 'Three Phase', size: '6 inch (V6)', rpm: '2880', 'water_outlet': '3 inch' },
      featured: true,
      rating: 4.8,
      sku: 'SM-V6-5HP',
    },
    {
      name: 'V8 Submersible Motor 10 HP',
      description: 'Heavy-duty V8 submersible motor for industrial and irrigation applications. Class F insulation, high-grade silicon steel lamination for superior performance.',
      price: 28000,
      originalPrice: 32000,
      stock: 5,
      categoryId: motors._id,
      image: '',
      specifications: { hp: '10 HP', voltage: '415V', phase: 'Three Phase', size: '8 inch (V8)', rpm: '2880', 'water_outlet': '4 inch' },
      featured: false,
      rating: 4.6,
      sku: 'SM-V8-10HP',
    },

    // Copper Winding Wire
    {
      name: 'Copper Winding Wire 18 SWG — 1kg',
      description: 'Premium enamelled copper winding wire, 18 SWG gauge. Double-coated polyester enamel insulation for superior dielectric strength. Ideal for motor rewinding.',
      price: 950,
      originalPrice: 1100,
      stock: 100,
      categoryId: copper._id,
      image: '',
      specifications: { gauge: '18 SWG', weight: '1 kg', insulation: 'Polyester Enamel', 'temperature_class': 'Class B (130°C)', purity: '99.9% Copper' },
      featured: true,
      rating: 4.4,
      sku: 'CW-18SWG-1KG',
    },
    {
      name: 'Copper Winding Wire 20 SWG — 1kg',
      description: 'High-quality 20 SWG copper winding wire with uniform diameter and smooth enamel coating. Perfect for submersible motor rewinding and transformer coils.',
      price: 980,
      originalPrice: 1050,
      stock: 80,
      categoryId: copper._id,
      image: '',
      specifications: { gauge: '20 SWG', weight: '1 kg', insulation: 'Polyester Enamel', 'temperature_class': 'Class B (130°C)', purity: '99.9% Copper' },
      featured: false,
      rating: 4.3,
      sku: 'CW-20SWG-1KG',
    },
    {
      name: 'Copper Winding Wire 22 SWG — 500g',
      description: 'Fine-gauge 22 SWG copper winding wire for precision rewinding work. Suitable for fractional HP motors and small transformers.',
      price: 520,
      originalPrice: 600,
      stock: 60,
      categoryId: copper._id,
      image: '',
      specifications: { gauge: '22 SWG', weight: '500g', insulation: 'Polyester Enamel', 'temperature_class': 'Class B (130°C)', purity: '99.9% Copper' },
      featured: false,
      rating: 4.2,
      sku: 'CW-22SWG-500G',
    },
    {
      name: 'Super Enamelled Copper Wire 16 SWG — 2kg',
      description: 'Heavy-duty 16 SWG super enamelled copper wire for industrial motor rewinding. Thermally upgraded insulation for harsh environments.',
      price: 2200,
      originalPrice: 2500,
      stock: 40,
      categoryId: copper._id,
      image: '',
      specifications: { gauge: '16 SWG', weight: '2 kg', insulation: 'Super Enamel (Modified Polyester)', 'temperature_class': 'Class F (155°C)', purity: '99.9% Copper' },
      featured: true,
      rating: 4.6,
      sku: 'CW-16SWG-2KG',
    },

    // Capacitors
    {
      name: 'Motor Start Capacitor 150µF',
      description: 'High-quality motor start capacitor, 150µF / 250V AC. Designed for single-phase submersible motors. Quick start, reliable performance.',
      price: 280,
      originalPrice: 350,
      stock: 200,
      categoryId: capacitors._id,
      image: '',
      specifications: { capacitance: '150 µF', voltage: '250V AC', type: 'Electrolytic Start Capacitor', frequency: '50 Hz', 'duty_cycle': 'Intermittent' },
      featured: false,
      rating: 4.1,
      sku: 'CAP-START-150',
    },
    {
      name: 'Motor Run Capacitor 25µF',
      description: 'Oil-filled motor run capacitor, 25µF / 440V AC. Long-life design for continuous duty. Ideal for submersible pump motors.',
      price: 220,
      originalPrice: 280,
      stock: 150,
      categoryId: capacitors._id,
      image: '',
      specifications: { capacitance: '25 µF', voltage: '440V AC', type: 'Oil-Filled Run Capacitor', frequency: '50 Hz', 'duty_cycle': 'Continuous' },
      featured: true,
      rating: 4.5,
      sku: 'CAP-RUN-25',
    },
    {
      name: 'Dual Capacitor 30+5µF',
      description: 'Dual run capacitor combining 30µF and 5µF in a single unit. Space-saving design for compressor and motor applications.',
      price: 350,
      originalPrice: 420,
      stock: 75,
      categoryId: capacitors._id,
      image: '',
      specifications: { capacitance: '30+5 µF', voltage: '440V AC', type: 'Dual Run Capacitor', frequency: '50 Hz' },
      featured: false,
      rating: 4.0,
      sku: 'CAP-DUAL-30-5',
    },

    // Pump Accessories
    {
      name: 'SS Impeller for V4 Pump',
      description: 'Stainless steel impeller for V4 submersible pump. Precision-cast for balanced rotation and maximum water output. Corrosion-resistant 304 SS.',
      price: 650,
      originalPrice: 800,
      stock: 45,
      categoryId: pumpAcc._id,
      image: '',
      specifications: { material: 'SS 304', size: 'V4 Compatible', stages: 'Single Stage', 'max_flow': '100 LPM' },
      featured: false,
      rating: 4.3,
      sku: 'PA-IMP-V4',
    },
    {
      name: 'Mechanical Seal 22mm',
      description: 'Premium mechanical shaft seal for submersible pumps. Silicon carbide/carbon face combination for excellent wear resistance and sealing.',
      price: 380,
      originalPrice: 450,
      stock: 120,
      categoryId: pumpAcc._id,
      image: '',
      specifications: { size: '22mm', material: 'SiC/Carbon', type: 'Spring-Loaded', 'pressure_rating': '10 bar' },
      featured: true,
      rating: 4.4,
      sku: 'PA-SEAL-22',
    },
    {
      name: 'Thrust Bearing Set',
      description: 'High-load thrust bearing set for submersible motors. Hardened steel races with precision ground balls for smooth operation under heavy loads.',
      price: 450,
      originalPrice: 550,
      stock: 60,
      categoryId: pumpAcc._id,
      image: '',
      specifications: { type: 'Thrust Ball Bearing', material: 'Chrome Steel', 'load_capacity': '5000N', 'suitable_for': 'V4/V6 Motors' },
      featured: false,
      rating: 4.2,
      sku: 'PA-BEARING-THR',
    },
    {
      name: 'Motor Cable 3-Core 2.5mm — 50m',
      description: 'Submersible motor cable, 3-core 2.5mm² flat cable. PVC insulated, suitable for underwater use. Rated for continuous submersion.',
      price: 2800,
      originalPrice: 3200,
      stock: 30,
      categoryId: pumpAcc._id,
      image: '',
      specifications: { cores: '3 Core', size: '2.5 mm²', length: '50 meters', insulation: 'PVC', 'voltage_rating': '1100V' },
      featured: false,
      rating: 4.5,
      sku: 'PA-CABLE-3C-50',
    },

    // Control Panels
    {
      name: 'DOL Starter Panel 3 HP',
      description: 'Direct On-Line starter panel for 3 HP single-phase submersible pumps. Built-in overload relay, dry-run protection, and voltmeter. IP54 rated enclosure.',
      price: 2400,
      originalPrice: 2800,
      stock: 20,
      categoryId: panels._id,
      image: '',
      specifications: { type: 'DOL Starter', hp: '3 HP', phase: 'Single Phase', protection: 'Overload + Dry Run', 'ip_rating': 'IP54' },
      featured: true,
      rating: 4.6,
      sku: 'CP-DOL-3HP',
    },
    {
      name: 'Star-Delta Starter 7.5 HP',
      description: 'Star-Delta starter for 7.5 HP three-phase submersible motors. Reduces starting current by 33%. Timer-based auto changeover.',
      price: 5500,
      originalPrice: 6200,
      stock: 12,
      categoryId: panels._id,
      image: '',
      specifications: { type: 'Star-Delta', hp: '7.5 HP', phase: 'Three Phase', 'starting_current': 'Reduced (33%)', timer: 'Adjustable 3-30s' },
      featured: false,
      rating: 4.5,
      sku: 'CP-SD-7.5HP',
    },
    {
      name: 'Digital Motor Protector',
      description: 'Microprocessor-based digital motor protection relay. Protects against overvoltage, undervoltage, phase imbalance, dry-run, and overload. LCD display.',
      price: 1800,
      originalPrice: 2200,
      stock: 35,
      categoryId: panels._id,
      image: '',
      specifications: { type: 'Digital Protection Relay', display: 'LCD', protection: 'OV/UV/Phase/Dry-Run/Overload', 'voltage_range': '160-280V' },
      featured: false,
      rating: 4.3,
      sku: 'CP-DIGI-PROT',
    },

    // Pipes & Fittings
    {
      name: 'GI Drop Pipe 1.5" — 3m',
      description: 'Galvanized iron drop pipe for submersible pump installation. 1.5 inch diameter, 3 meters length. Threaded both ends for easy connection.',
      price: 850,
      originalPrice: 950,
      stock: 50,
      categoryId: pipes._id,
      image: '',
      specifications: { material: 'Galvanized Iron', diameter: '1.5 inch', length: '3 meters', 'thread_type': 'BSP', 'pressure_rating': '15 bar' },
      featured: false,
      rating: 4.1,
      sku: 'PF-GI-1.5-3M',
    },
    {
      name: 'HDPE Pipe 2" — 100m Coil',
      description: 'High-density polyethylene pipe for submersible pump delivery lines. Lightweight, corrosion-free, and easy to install. ISI marked.',
      price: 4500,
      originalPrice: 5000,
      stock: 15,
      categoryId: pipes._id,
      image: '',
      specifications: { material: 'HDPE (PE-100)', diameter: '2 inch', length: '100 meters (coil)', 'pressure_rating': 'PN 6', standard: 'IS 4984' },
      featured: true,
      rating: 4.4,
      sku: 'PF-HDPE-2-100',
    },
    {
      name: 'Non-Return Valve 2" Brass',
      description: 'Brass non-return valve (check valve) to prevent backflow in pump installations. Heavy-duty spring-loaded design with SS spring.',
      price: 550,
      originalPrice: 650,
      stock: 70,
      categoryId: pipes.id,
      image: '',
      specifications: { material: 'Brass', size: '2 inch', type: 'Spring-Loaded NRV', 'pressure_rating': '16 bar' },
      featured: false,
      rating: 4.2,
      sku: 'PF-NRV-2-BR',
    },
  ];

  for (const product of productsList) {
    // Map the categoryId correctly
    if (product.categoryId && product.categoryId._id) {
      product.categoryId = product.categoryId._id;
    }
    await Product.create(product);
  }
  console.log('✓ Products created (22 items)');

  console.log('\n✅ Seed complete! Start server with: npm start');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
