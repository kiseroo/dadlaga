const mongoose = require('mongoose');
const connectDB = require('../config/database');
const District = require('../models/District');
const Khoroo = require('../models/Khoroo');
const { districts, khoroos } = require('../data/districtData');

const seedDatabase = async () => {  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Clear existing data (optional - remove for production)
    await District.deleteMany({});
    await Khoroo.deleteMany({});
    console.log('Cleared existing data');
    
    // Seed districts
    const createdDistricts = await District.insertMany(districts);
    console.log(`Seeded ${createdDistricts.length} districts`);
    
    // Seed khoroos
    const createdKhoroos = await Khoroo.insertMany(khoroos);
    console.log(`Seeded ${createdKhoroos.length} khoroos`);
    
    console.log('Database seeding completed successfully');
    
    // Disconnect from database
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return { districts: createdDistricts.length, khoroos: createdKhoroos.length };
  } catch (error) {
    console.error('Database seeding failed:', error);
    
    // Ensure connection is closed even if there's an error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    process.exit(1);
  }
};

// Execute the seeder if this script is run directly
if (require.main === module) {
  seedDatabase()
    .then(result => {
      console.log(`Seeding completed: ${result.districts} districts and ${result.khoroos} khoroos added`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = seedDatabase;
}
