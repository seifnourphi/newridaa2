import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.model.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const updateAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ridaa');
    console.log('✅ Connected to MongoDB');

    // Get admin credentials from command line or use defaults
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin';

    // Find admin
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    
    if (!admin) {
      console.log('❌ Admin user not found with username:', username);
      console.log('   Creating new admin user...');
      
      // Create new admin
      const newAdmin = await Admin.create({
        username: username.toLowerCase(),
        email: `${username}@ridaa.com`,
        password: password,
        isActive: true
      });

      console.log('✅ Admin user created successfully!');
      console.log('   Username:', newAdmin.username);
      console.log('   Email:', newAdmin.email);
      console.log('   ID:', newAdmin._id);
    } else {
      // Update password
      admin.password = password;
      admin.loginAttempts = 0;
      admin.lockUntil = undefined;
      await admin.save();

      console.log('✅ Admin password updated successfully!');
      console.log('   Username:', admin.username);
      console.log('   Email:', admin.email);
      console.log('   ID:', admin._id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateAdminPassword();

