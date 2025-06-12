// District data with names and khoroo counts
const districtData = {
  'bgd': { name: 'Баянгол дүүрэг', khorooCount: 25 },
  'bhd': { name: 'Багахангай дүүрэг', khorooCount: 2 },
  'bnd': { name: 'Бага нуур дүүрэг', khorooCount: 5 },
  'bzd': { name: 'Баянзүрх дүүрэг', khorooCount: 43 },
  'chd': { name: 'Чингэлтэй дүүрэг', khorooCount: 19 },
  'hud': { name: 'Хан-Уул дүүрэг', khorooCount: 25 },
  'hud1': { name: 'Хан-Уул дүүрэг 1', khorooCount: 25 },
  'sbd': { name: 'Сүхбаатар дүүрэг', khorooCount: 20 },
  'shd': { name: 'Сонгинохайрхан дүүрэг', khorooCount: 43 }
  // You can add any other districts here
};

// Mapping between Cyrillic and Latin codes
const districtCodeMap = {
  'ЧД': 'chd',    
  'БЗД': 'bzd',   
  'БГД': 'bgd',   
  'СБД': 'sbd',   
  'СХД': 'shd',   
  'ХУД': 'hud',   
  'БХД': 'bhd'    
};

module.exports = {
  districtData,
  districtCodeMap
};
