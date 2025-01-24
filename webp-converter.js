import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

async function convertToWebP(inputPath, outputPath) {
  try {
    // If no output path is provided, create one based on the input file
    if (!outputPath) {
      const dir = path.dirname(inputPath);
      const filename = path.basename(inputPath, path.extname(inputPath));
      outputPath = path.join(dir, `${filename}.webp`);
    }

    // Perform the conversion
    await sharp(inputPath)
      .webp({ quality: 80 }) // You can adjust the quality as needed
      .toFile(outputPath);

    console.log(`Conversion successful: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error during conversion:', error);
    throw error;
  }
}

// Main function to handle command-line arguments
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node webp-converter.js <input-file> [output-file]');
    return;
  }

  const inputPath = args[0];
  const outputPath = args[1];

  try {
    // Check if input file exists
    await fs.access(inputPath);
    
    const result = await convertToWebP(inputPath, outputPath);
    console.log('Conversion completed successfully.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Error: Input file does not exist.');
    } else {
      console.error('An error occurred:', error.message);
    }
  }
}

main();

// Example usage (uncomment to test):
// convertToWebP('/path/to/input/image.jpg', '/path/to/output/image.webp');

