// const sequelize = require('./db'); // No longer needed for Mongo
const { User } = require('./models');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
  params[args[i].replace('--', '')] = args[i + 1];
}

async function createAdmin() {
  const { name, username, email, password, phone } = params;

  if (!name || !email || !password) {
    console.error('Usage: node create-admin.js --name "Admin" --username "admin123" --email "admin@email.com" --password "pass" --phone "9080799320"');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username: username || '' }] 
    });

    if (existingUser) {
      console.log(`User already exists. Updating...`);
      existingUser.role = 'admin';
      existingUser.password = await bcrypt.hash(password, 10);
      existingUser.name = name;
      existingUser.username = username || existingUser.username;
      existingUser.phone = phone || existingUser.phone;
      await existingUser.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        name,
        username: username || '',
        email,
        password: hashedPassword,
        phone: phone || '9080799320',
        role: 'admin',
      });
      console.log('✅ New Admin user created successfully!');
    }
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
