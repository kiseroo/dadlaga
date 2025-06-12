const mongoose = require('mongoose');
const District = require('../models/District');
const Khoroo = require('../models/Khoroo');
const { connectDB } = require('../config/database');

// District data with names and khoroo counts (from your original data)
const districtData = {
  'bgd': { name: 'Баянгол дүүрэг', khorooCount: 25, cyrillicCode: 'БГД' },
  'bhd': { name: 'Багахангай дүүрэг', khorooCount: 2, cyrillicCode: 'БХД' },
  'bnd': { name: 'Бага нуур дүүрэг', khorooCount: 5, cyrillicCode: 'БНД' },
  'bzd': { name: 'Баянзүрх дүүрэг', khorooCount: 43, cyrillicCode: 'БЗД' },
  'chd': { name: 'Чингэлтэй дүүрэг', khorooCount: 19, cyrillicCode: 'ЧД' },
  'hud': { name: 'Хан-Уул дүүрэг', khorooCount: 25, cyrillicCode: 'ХУД' },
  'sbd': { name: 'Сүхбаатар дүүрэг', khorooCount: 20, cyrillicCode: 'СБД' },
  'shd': { name: 'Сонгинохайрхан дүүрэг', khorooCount: 43, cyrillicCode: 'СХД' }
};

const migrateData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Clear existing data (optional - remove for production)
    await District.deleteMany({});
    await Khoroo.deleteMany({});
    console.log('Cleared existing data');
    
    // Create districts
    for (const [code, data] of Object.entries(districtData)) {
      const district = new District({
        code,
        name: data.name,
        khorooCount: data.khorooCount,
        cyrillicCode: data.cyrillicCode
      });
      
      await district.save();
      console.log(`District created: ${code} - ${data.name}`);
      
      // Create khoroos for each district
      for (let i = 1; i <= data.khorooCount; i++) {
        // Format khoroo number with leading zero if needed
        const number = i < 10 ? `${i}` : `${i}`;
        
        const khoroo = new Khoroo({
          districtCode: code,
          number,
          name: `${data.name} ${i}-р хороо`
        });
        
        await khoroo.save();
      }
      console.log(`Created ${data.khorooCount} khoroos for ${code}`);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateData();
