const District = require('../models/District');
const Khoroo = require('../models/Khoroo');
const Sambar = require('../models/Sambar');

// For backward compatibility during transition
const { districtData, districtCodeMap } = require('../data/districtData');

// Get all districts information
exports.getAllDistricts = async (req, res) => {
  try {
    // Check if we have districts in the database
    const districtsCount = await District.countDocuments();
    
    // If we have districts in DB, use them
    if (districtsCount > 0) {
      const districts = await District.find().sort({ name: 1 });
      
      // Format the response to match the structure used in the frontend
      const formattedDistricts = {};
      districts.forEach(district => {
        formattedDistricts[district.code] = {
          name: district.name,
          khorooCount: district.khorooCount,
          cyrillicCode: district.cyrillicCode
        };
      });
      
      return res.status(200).json({
        success: true,
        data: formattedDistricts
      });
    } else {
      // Fall back to static data if database is not yet populated
      return res.status(200).json({
        success: true,
        data: districtData
      });
    }
  } catch (error) {
    console.error('Error fetching districts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching districts'
    });
  }
};

// Get specific district information
exports.getDistrictByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Try to get from database first
    const district = await District.findOne({ code });
    
    if (district) {
      return res.status(200).json({
        success: true,
        data: {
          name: district.name,
          khorooCount: district.khorooCount,
          cyrillicCode: district.cyrillicCode
        }
      });
    } else if (districtData[code]) {
      // Fall back to static data if not in database
      return res.status(200).json({
        success: true,
        data: districtData[code]
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }
  } catch (error) {
    console.error('Error fetching district:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching district'
    });
  }
};

// Get mapping between Cyrillic and Latin codes
exports.getDistrictCodeMap = async (req, res) => {
  try {
    // Check if we have districts in the database
    const districtsCount = await District.countDocuments();
    
    if (districtsCount > 0) {
      const districts = await District.find();
      
      const codeMap = {};
      districts.forEach(district => {
        if (district.cyrillicCode) {
          codeMap[district.cyrillicCode] = district.code;
        }
      });
      
      return res.status(200).json({
        success: true,
        data: codeMap
      });
    } else {
      // Fall back to static data
      return res.status(200).json({
        success: true,
        data: districtCodeMap
      });
    }
  } catch (error) {
    console.error('Error fetching district code map:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching district code map'
    });
  }
};

// Get all khoroos for a district
exports.getKhoroosByDistrict = async (req, res) => {
  try {
    const { districtCode } = req.params;
    
    // Check if khoroos collection is populated
    const khoroosCount = await Khoroo.countDocuments();
    
    if (khoroosCount > 0) {
      // Check if district exists
      const district = await District.findOne({ code: districtCode });
      if (!district) {
        return res.status(404).json({
          success: false,
          message: 'District not found'
        });
      }
      
      // Get all khoroos for the district
      const khoroos = await Khoroo.find({ districtCode }).sort({ number: 1 });
      
      return res.status(200).json({
        success: true,
        data: khoroos
      });
    } else {
      // Fall back to static data
      if (!districtData[districtCode]) {
        return res.status(404).json({
          success: false,
          message: 'District not found'
        });
      }
      
      const khorooCount = districtData[districtCode].khorooCount;
      const khoroos = [];
      
      for (let i = 1; i <= khorooCount; i++) {
        const number = i < 10 ? `${i}` : `${i}`;
        khoroos.push({
          districtCode,
          number,
          name: `${districtData[districtCode].name} ${i}-р хороо`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: khoroos
      });
    }
  } catch (error) {
    console.error('Error fetching khoroos:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching khoroos'
    });
  }
};

// Get sambars by khoroo
exports.getSambarsByKhoroo = async (req, res) => {
  try {
    const { districtCode, khorooNumber } = req.params;
    
    // Get sambars for this khoroo
    const sambars = await Sambar.find({
      'khorooInfo.district': districtCode,
      'khorooInfo.khoroo': khorooNumber
    }).sort({ name: 1 });
    
    // Get district and khoroo info
    let district, khoroo;
    
    const districtsInDb = await District.countDocuments() > 0;
    const khoroosInDb = await Khoroo.countDocuments() > 0;
    
    if (districtsInDb) {
      district = await District.findOne({ code: districtCode });
    }
    
    if (khoroosInDb) {
      khoroo = await Khoroo.findOne({ 
        districtCode, 
        number: khorooNumber 
      });
    }
    
    // Fall back to static data if necessary
    if (!district && districtData[districtCode]) {
      district = {
        code: districtCode,
        name: districtData[districtCode].name,
        khorooCount: districtData[districtCode].khorooCount
      };
    }
    
    if (!khoroo && district) {
      khoroo = {
        districtCode,
        number: khorooNumber,
        name: `${district.name} ${khorooNumber}-р хороо`
      };
    }
    
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        district,
        khoroo,
        sambars
      }
    });
  } catch (error) {
    console.error('Error fetching sambars by khoroo:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching sambars by khoroo'
    });
  }
};
