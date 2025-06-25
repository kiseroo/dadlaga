const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Sambar = require('../models/Sambar');
const Shon = require('../models/Shon');
const { districts } = require('../data/districtData');

// Helper function to generate random coordinates within a bounding box
const generateRandomCoordinate = (bounds) => {
  const { north, south, east, west } = bounds;
  
  // Generate random latitude within bounds
  const lat = south + Math.random() * (north - south);
  
  // Generate random longitude within bounds
  const lng = west + Math.random() * (east - west);
  
  return { lat, lng };
};

// Function to generate a random sambar name
const generateRandomSambarName = (districtCode, khorooNumber) => {
  const prefixes = ['С', 'П', 'М', 'А', 'Б', 'Г', 'Д', 'Ж'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNum = Math.floor(Math.random() * 100) + 1;
  return `${randomPrefix}-${districtCode.toUpperCase()}-${khorooNumber}-${randomNum}`;
};

// Function to generate a random shon name for a sambar
const generateRandomShonName = (sambarName, index) => {
  const shonPrefixes = ['Ш', 'Ш1', 'Ш2', 'ШБ', 'ШГ'];
  const randomPrefix = shonPrefixes[Math.floor(Math.random() * shonPrefixes.length)];
  return `${randomPrefix}-${sambarName}-${index + 1}`;
};

// Function to generate random shon properties
const generateRandomShonProperties = () => {
  const colors = ['green', 'red', 'yellow'];
  const shapes = ['one-line', 'two-lines', 'three-lines'];
  
  return {
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)]
  };
};

// Generate a list of district/khoroo pairs to create sambars in
const generateDistrictKhorooPairs = (sambarCount = 20) => {
  const districtKhorooPairs = [];
  
  // Convert districts array to a more usable format
  const districtObjects = districts.map(district => ({
    code: district.code,
    name: district.name,
    khorooCount: district.khorooCount,
    cyrillicCode: district.cyrillicCode
  }));
  
  // Loop until we have enough pairs
  while (districtKhorooPairs.length < sambarCount) {
    // Randomly select a district
    const randomDistrict = districtObjects[Math.floor(Math.random() * districtObjects.length)];
    
    // Randomly select a khoroo from that district
    const randomKhorooNumber = Math.floor(Math.random() * randomDistrict.khorooCount) + 1;
    
    // Add the pair to our list
    districtKhorooPairs.push({
      districtCode: randomDistrict.code,
      districtName: randomDistrict.name,
      khorooNumber: randomKhorooNumber,
      cyrillicCode: randomDistrict.cyrillicCode
    });
  }
  
  return districtKhorooPairs;
};

// Function to get a bounding box for a district/khoroo
const getBoundingBoxForKhoroo = (districtCode, khorooNumber) => {
  // These are approximate bounding boxes for districts in UB
  // In a real implementation, you would parse the KML to get the actual polygon
  const districtBounds = {
    'bgd': { north: 47.9350, south: 47.9000, east: 106.9000, west: 106.8350 },
    'bhd': { north: 47.7500, south: 47.7000, east: 107.0500, west: 107.0000 },
    'bnd': { north: 47.8000, south: 47.7500, east: 108.4000, west: 108.3500 },
    'bzd': { north: 47.9500, south: 47.8500, east: 107.0500, west: 106.9500 },
    'chd': { north: 47.9300, south: 47.9000, east: 106.9500, west: 106.9000 },
    'hud': { north: 47.9000, south: 47.8500, east: 106.9000, west: 106.8000 },
    'sbd': { north: 47.9300, south: 47.9000, east: 106.9700, west: 106.9200 },
    'shd': { north: 47.8000, south: 47.7500, east: 106.7500, west: 106.7000 },
    'skhd': { north: 47.9800, south: 47.9300, east: 106.9300, west: 106.8800 },
  };
  
  // Apply a small random variation to simulate different khoroos within a district
  const variation = 0.005; // Approximately 500 meters
  const bounds = districtBounds[districtCode] || {
    north: 47.9184 + 0.01,
    south: 47.9184 - 0.01,
    east: 106.9177 + 0.01,
    west: 106.9177 - 0.01
  };
  
  // Add some randomness to bounds to simulate different khoroos
  const khorooBounds = {
    north: bounds.north - (khorooNumber % 5) * variation,
    south: bounds.south - (khorooNumber % 5) * variation,
    east: bounds.east + (khorooNumber % 4) * variation,
    west: bounds.west + (khorooNumber % 4) * variation
  };
  
  return khorooBounds;
};

// Function to create a sambar with random location in a khoroo
const createSambar = async (districtCode, khorooNumber, cyrillicCode) => {
  try {
    // Get approximate bounding box for this khoroo
    const bounds = getBoundingBoxForKhoroo(districtCode, khorooNumber);
    
    // Generate a random coordinate within this bounding box
    const coordinates = generateRandomCoordinate(bounds);
    
    // Generate a random name for the sambar
    const name = generateRandomSambarName(cyrillicCode, khorooNumber);
    
    // Create khorooInfo for the sambar
    const khorooInfo = {
      name: `${districtCode.toUpperCase()}_${khorooNumber}`,
      district: districtCode.toLowerCase(),
      khoroo: `${khorooNumber}`
    };
    
    // Create a new Sambar instance
    const sambar = new Sambar({
      name,
      coordinates,
      khorooInfo
    });
    
    // Save the sambar to the database
    await sambar.save();
    
    console.log(`Created sambar: ${name} in ${districtCode}-${khorooNumber}`);
    
    return sambar;
  } catch (error) {
    console.error(`Error creating sambar in ${districtCode}-${khorooNumber}:`, error);
    throw error;
  }
};

// Function to create a shon for a sambar
const createShon = async (sambar, index) => {
  try {
    // Get bounds for the khoroo
    const bounds = getBoundingBoxForKhoroo(
      sambar.khorooInfo.district, 
      sambar.khorooInfo.khoroo
    );
    
    // Generate a random coordinate within this bounding box
    const location = generateRandomCoordinate(bounds);
    
    // Generate a random name for the shon based on sambar
    const code = generateRandomShonName(sambar.name, index);
    
    // Get random color and shape
    const { color, shape } = generateRandomShonProperties();
    
    // Create a new Shon instance
    const shon = new Shon({
      sambarCode: sambar.name,
      code,
      location,
      color,
      shape,
      khorooInfo: sambar.khorooInfo
    });
    
    // Save the shon to the database
    await shon.save();
    
    console.log(`Created shon: ${code} for sambar ${sambar.name}`);
    
    return shon;
  } catch (error) {
    console.error(`Error creating shon for sambar ${sambar.name}:`, error);
    throw error;
  }
};

// Main function to seed sambars and shons
const seedSampleData = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Database connected successfully');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    await Sambar.deleteMany({});
    await Shon.deleteMany({});
    console.log('Cleared existing sambar and shon data');
    
    // Configuration
    const sambarCount = 20;
    const shonsPerSambar = 10;
    
    // Generate district/khoroo pairs
    const districtKhorooPairs = generateDistrictKhorooPairs(sambarCount);
    
    // Create sambars
    const sambars = [];
    for (const { districtCode, khorooNumber, cyrillicCode } of districtKhorooPairs) {
      try {
        const sambar = await createSambar(districtCode, khorooNumber, cyrillicCode);
        sambars.push(sambar);
      } catch (error) {
        console.error(`Failed to create sambar in ${districtCode}-${khorooNumber}:`, error);
      }
    }
    
    console.log(`Created ${sambars.length} sambars`);
    
    // Create shons for each sambar
    let totalShons = 0;
    for (const sambar of sambars) {
      for (let i = 0; i < shonsPerSambar; i++) {
        try {
          await createShon(sambar, i);
          totalShons++;
        } catch (error) {
          console.error(`Failed to create shon ${i} for sambar ${sambar.name}:`, error);
        }
      }
    }
    
    console.log(`Created ${totalShons} shons for ${sambars.length} sambars`);
    
    // Disconnect from the database
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return { sambars: sambars.length, shons: totalShons };
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
  seedSampleData()
    .then(result => {
      console.log(`Seeding completed: ${result.sambars} sambars and ${result.shons} shons added`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedSampleData;
