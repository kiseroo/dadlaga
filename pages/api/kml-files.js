import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {    // Get the absolute path to the public/khoroo2021 directory
    const kmlDirPath = path.join(process.cwd(), 'public', 'khoroo2021');
    
    // Read all files from the directory
    const files = fs.readdirSync(kmlDirPath);
    
    // Filter only KML files
    const kmlFiles = files.filter(file => file.toLowerCase().endsWith('.kml'));
    
    // Return the list of KML files
    res.status(200).json({ files: kmlFiles });
  } catch (error) {
    console.error('Error reading KML directory:', error);
    res.status(500).json({ error: 'Failed to read KML files directory' });
  }
}
