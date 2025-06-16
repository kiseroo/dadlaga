const mongoose = require('mongoose');
const District = require('../models/District');
const Khoroo = require('../models/Khoroo');
const connectToMongoDB = require('../config/database');
const districtData = require('../data/districtSeeder');
const khorooData = require('../data/khorooSeeder');

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectToMongoDB();
    console.log('Database connected successfully');
    
    // Clear existing data (optional - comment this out if you don't want to delete existing data)
    await District.deleteMany({});
    await Khoroo.deleteMany({});
    console.log('Cleared existing data');
    
    // Seed districts
    console.log('Seeding districts...');
    const insertedDistricts = await District.insertMany(districtData);
    console.log(`${insertedDistricts.length} districts inserted successfully`);
    
    // Seed khoroos
    console.log('Seeding khoroos...');
    const insertedKhoroos = await Khoroo.insertMany(khorooData);
    console.log(`${insertedKhoroos.length} khoroos inserted successfully`);
    
    console.log('Database seeding completed successfully');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    // Close the connection in case of error
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
