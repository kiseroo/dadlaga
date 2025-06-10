import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { district1 = 'bzd', district2 = 'bgd', khoroo1 = '1', khoroo2 = '1' } = req.query;
  
  // Helper function to check if file exists
  const fileExists = (filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch (err) {
      console.error(`Error checking file existence: ${filePath}`, err);
      return false;
    }
  };
  
  // Get path to KML files - use only public/khoroo2021
  const basePath = path.join(process.cwd(), 'public', 'khoroo2021');
  const file1Path = path.join(basePath, `${district1}-${khoroo1}.kml`);
  const file2Path = path.join(basePath, `${district2}-${khoroo2}.kml`);
  
  // Check if files exist
  const file1Exists = fileExists(file1Path);
  const file2Exists = fileExists(file2Path);
  
  if (!file1Exists || !file2Exists) {
    return res.status(404).json({
      error: 'One or both files not found',
      file1: { path: file1Path, exists: file1Exists },
      file2: { path: file2Path, exists: file2Exists }
    });
  }
  
  try {
    // Read the KML files
    const file1Content = fs.readFileSync(file1Path, 'utf8');
    const file2Content = fs.readFileSync(file2Path, 'utf8');
    
    // Extract first few coordinates from each file for comparison
    const extractCoordinates = (content) => {
      const coordsMatch = content.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
      if (!coordsMatch || !coordsMatch[1]) return null;
      
      const coordsText = coordsMatch[1].trim();
      const coordLines = coordsText.split(/\s+/).slice(0, 5); // Get first 5 coordinate pairs
      
      return coordLines.map(line => {
        const [lng, lat, alt] = line.split(',').map(Number);
        return { lng, lat, alt };
      });
    };
    
    const file1Coords = extractCoordinates(file1Content);
    const file2Coords = extractCoordinates(file2Content);
    
    // Check for structural differences
    const file1Size = fs.statSync(file1Path).size;
    const file2Size = fs.statSync(file2Path).size;
    
    // Check for basic XML structure differences
    const xmlTags1 = (file1Content.match(/<[^>]+>/g) || []).slice(0, 20);
    const xmlTags2 = (file2Content.match(/<[^>]+>/g) || []).slice(0, 20);
    
    return res.status(200).json({
      comparison: {
        file1: {
          name: `${district1}-${khoroo1}.kml`,
          size: file1Size,
          sampleCoordinates: file1Coords,
          xmlStructureSample: xmlTags1
        },
        file2: {
          name: `${district2}-${khoroo2}.kml`,
          size: file2Size,
          sampleCoordinates: file2Coords,
          xmlStructureSample: xmlTags2
        }
      }
    });
  } catch (error) {
    console.error('Error comparing KML files:', error);
    return res.status(500).json({ error: `Error comparing KML files: ${error.message}` });
  }
}
