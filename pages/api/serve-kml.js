import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { district, khoroo } = req.query;
  
  // Log request info for debugging
  console.log(`KML Request - District: ${district}, Khoroo: ${khoroo || 'none'}`);
  console.log('Current working directory:', process.cwd());
  
  // Safety check for valid inputs
  if (!district || !/^[a-z0-9]{3,4}$/.test(district)) {
    return res.status(400).json({ error: 'Invalid district code' });
  }
  
  let filePath;
  // Use only the public/khoroo2021 directory
  const baseDir = process.cwd();
  const khorooPath = path.join(baseDir, 'public', 'khoroo2021');
  
  console.log(`Checking KML path: ${khorooPath} (${fs.existsSync(khorooPath) ? 'exists' : 'does not exist'})`);
  
  // If we're looking for a specific khoroo
  if (khoroo && /^\d+$/.test(khoroo)) {
    // Try public/khoroo2021/district-khoroo.kml
    filePath = path.join(khorooPath, `${district}-${khoroo}.kml`);
    
    // Fallback if needed
    if (!fs.existsSync(filePath)) {
      // Try public/khoroo2021/district/khoroo.kml (alternate folder structure)
      const altFilePath = path.join(khorooPath, district, `${khoroo}.kml`);
      if (fs.existsSync(altFilePath)) {
        filePath = altFilePath;
      }
    }
  } else {
    // Try public/khoroo2021/district.kml
    filePath = path.join(khorooPath, `${district}.kml`);
  }
  
  console.log(`Attempting to serve KML file: ${filePath}`);
  
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`KML file not found: ${filePath}`);
    
    // Try to list available files for this district to help debugging
    try {
      const files = fs.readdirSync(khorooPath);
      const matchingFiles = files.filter(file => file.startsWith(district));
      console.log(`Available files for district ${district}:`, matchingFiles);
    } catch (err) {
      console.error('Error listing directory:', err);
    }
    
    return res.status(404).json({ error: 'KML file not found' });
  }
  
  try {
    // Read the KML file
    const kmlData = fs.readFileSync(filePath, 'utf8');
    
    // Create a processed version of the KML with fixes for common issues
    // Fix 1: Remove xsi:schemaLocation attributes which can cause INVALID_REQUEST
    let processedKmlData = kmlData.replace(/xsi:schemaLocation="[^"]*"/g, '');
    
    // Fix 2: Make sure the XML is properly formatted (no invalid characters)
    processedKmlData = processedKmlData.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
    
    // Fix 3: Make sure URLs in the KML file are set to HTTPS if they're HTTP
    processedKmlData = processedKmlData.replace(/http:\/\//g, 'https://');
    
    // Set proper content type and headers for KML file
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Disable caching
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Log the size of the original and processed KML
    console.log(`KML file size: ${kmlData.length} bytes, processed size: ${processedKmlData.length} bytes`);
    
    // Send the processed KML data
    res.status(200).send(processedKmlData);
    console.log(`Successfully served KML file: ${district}${khoroo ? '-' + khoroo : ''}`);
  } catch (error) {
    console.error('Error reading KML file:', error);
    res.status(500).json({ error: 'Error reading KML file' });
  }
}
