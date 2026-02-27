import mongoose from 'mongoose';
import { User } from '../models/index.js';
import bcryptjs from 'bcryptjs';
import { v4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_box';

async function createLevel1User() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'mcc@gmail.com' });
    
    if (existingUser) {
      console.log('⚠️  User with email mcc@gmail.com already exists');
      console.log('Updating user details...');
      
      const hashedPassword = bcryptjs.hashSync('mcc@123', 10);
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.governanceLevel = 'LEVEL_1';
      existingUser.governanceType = 'CITY';
      await existingUser.save();
      
      console.log('✅ User updated for Level 1 access');
    } else {
      console.log('Creating new Level 1 user...');
      
      const hashedPassword = bcryptjs.hashSync('mcc@123', 10);
      const uid = v4();
      
      const newUser = new User({
        username: 'mcc_admin',
        email: 'mcc@gmail.com',
        password: hashedPassword,
        uuid: uid,
        phoneNo: '9999999999',
        role: 'admin',
        governanceLevel: 'LEVEL_1',
        governanceType: 'CITY',
        previous_complaints: [],
      });

      await newUser.save();
      console.log('✅ Level 1 user created successfully!');
    }

    console.log('\n📋 Login Credentials:');
    console.log('Email: mcc@gmail.com');
    console.log('Password: mcc@123');
    console.log('Role: Municipal Commissioner (Level 1)');

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

createLevel1User();
