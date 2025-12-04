import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.model.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ridaa');
    console.log('✅ Connected to MongoDB');

    // Get admin credentials from command line or use defaults
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const email = process.argv[4] || 'admin@ridaa.com';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with username:', username);
      console.log('   To update password, delete the admin first or use a different username.');
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password,
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   ID:', admin._id);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();

