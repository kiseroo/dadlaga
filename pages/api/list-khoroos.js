import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { district } = req.query;
  
  if (!district || !/^[a-z0-9]{3,4}$/.test(district)) {
    return res.status(400).json({ error: 'Invalid district code' });
  }
  
  try {
    console.log('Current working directory:', process.cwd());
    
    // Use only the public/khoroo2021 directory
    const khorooPath = path.join(process.cwd(), 'public', 'khoroo2021');
    
    console.log(`Checking directory: ${khorooPath} (${fs.existsSync(khorooPath) ? 'exists' : 'does not exist'})`);
    
    console.log(`Scanning directory: ${khorooPath}`);
    
    // List all files in the directory
    let files = [];
    try {
      files = fs.readdirSync(khorooPath);
      console.log(`Found ${files.length} total files in directory`);
    } catch (err) {
      console.error(`Error reading directory: ${err.message}`);
      return res.status(500).json({ error: 'Error reading directory' });
    }
    
    // Log first 10 files for debugging
    console.log('Sample files:', files.slice(0, 10));
    
    // Filter files that match the district pattern: district-number.kml
    const khorooFiles = files.filter(file => {
      // Match files like 'bzd-1.kml', 'bgd-25.kml', etc.
      const match = file.startsWith(`${district}-`) && file.endsWith('.kml');
      return match;
    });
    
    console.log(`Found ${khorooFiles.length} matching khoroo files for district ${district}`);
    console.log('Matching files:', khorooFiles);
    
    // Extract khoroo numbers from filenames
    const khorooNumbers = khorooFiles
      .map(file => {
        // Extract number part from filename: 'district-number.kml'
        const match = file.match(new RegExp(`${district}-(\\d+)\\.kml`));
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => a - b); // Sort in ascending order
    
    console.log(`Found ${khorooNumbers.length} valid khoroos for district ${district}`);
    
    // If no khoroo files found, try to read the district file to confirm it exists
    if (khorooNumbers.length === 0) {
      const districtFilePath = path.join(khorooPath, `${district}.kml`);
      try {
        const exists = fs.existsSync(districtFilePath);
        console.log(`District file ${district}.kml ${exists ? 'exists' : 'does not exist'}`);
      } catch (err) {
        console.error(`Error checking district file: ${err.message}`);
      }
    }
    
    return res.status(200).json({ 
      district, 
      khoroos: khorooNumbers,
      count: khorooNumbers.length,
      allFiles: khorooFiles
    });
  } catch (error) {
    console.error('Error listing khoroos:', error);
    return res.status(500).json({ error: `Error listing khoroos: ${error.message}` });
  }
}
