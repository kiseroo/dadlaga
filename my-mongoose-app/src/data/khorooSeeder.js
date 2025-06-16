// Generate khoroo data automatically
const districts = require('./districtSeeder');
const khoroos = [];

// Function to generate khoroos for a district
const generateKhoroosForDistrict = (districtCode, districtName, khorooCount) => {
  console.log(`Generating ${khorooCount} khoroos for ${districtName}`);
  for (let i = 1; i <= khorooCount; i++) {
    // Store khoroo number as a string without leading zeros
    const khorooNumber = `${i}`;
    khoroos.push({
      number: khorooNumber,
      name: `${i}-р хороо`,
      districtCode: districtCode,
      boundaries: `https://datacenter.ublight.mn/images/kml/khoroo2021/${districtCode}-${khorooNumber}.kml`,
    });
  }
};

// Loop through all districts and generate khoroos
districts.forEach(district => {
  generateKhoroosForDistrict(district.code, district.name, district.khorooCount);
});

module.exports = khoroos;
