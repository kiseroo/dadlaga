// District data with names, khoroo counts, and boundaries
const districts = [
  {
    code: 'bgd',
    name: 'Баянгол дүүрэг',
    khorooCount: 25,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/bgd.kml',
    cyrillicCode: 'БГД'
  },  
  {
    code: 'bhd',
    name: 'Багахангай дүүрэг',
    khorooCount: 2,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/bhd.kml',
    cyrillicCode: 'БХД'
  },
  {
    code: 'bnd',
    name: 'Багануур дүүрэг',
    khorooCount: 5,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/bnd.kml',
    cyrillicCode: 'БНД'
  },
  {
    code: 'bzd',
    name: 'Баянзүрх дүүрэг',
    khorooCount: 43,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/bzd.kml',
    cyrillicCode: 'БЗД'
  },  
  {
    code: 'chd',
    name: 'Чингэлтэй дүүрэг',
    khorooCount: 19,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/chd.kml',
    cyrillicCode: 'ЧД'
  },
  {
    code: 'hud',
    name: 'Хан-Уул дүүрэг',
    khorooCount: 25,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/hud.kml',
    cyrillicCode: 'ХУД'
  },
  {
    code: 'sbd',
    name: 'Сүхбаатар дүүрэг',
    khorooCount: 20,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/sbd.kml',
    cyrillicCode: 'СБД'
  },  
  {
    code: 'shd',
    name: 'Сонгинохайрхан дүүрэг',
    khorooCount: 43,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/shd.kml',
    cyrillicCode: 'СХД'
  },
  {
    code: 'nad',
    name: 'Налайх дүүрэг',
    khorooCount: 8,
    boundaries: 'https://datacenter.ublight.mn/images/kml/khoroo2021/nad.kml',
    cyrillicCode: 'НД'
  }
];

// Generate khoroo data automatically
const khoroos = [];

// Function to generate khoroos for a district
const generateKhoroosForDistrict = (districtCode, districtName, khorooCount) => {
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

module.exports = {
  districts,
  khoroos
};
