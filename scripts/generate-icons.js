#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Generates all required PWA icon sizes from a base 512x512 image
 * 
 * Usage: node scripts/generate-icons.js [path-to-base-icon.png]
 * 
 * Requirements: sharp package
 * Install: npm install --save-dev sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(process.cwd(), 'public');

// Get base icon path from command line or use default
const baseIconPath = process.argv[2] || path.join(publicDir, 'icon-512x512.png');

async function generateIcons() {
  try {
    // Check if base icon exists
    if (!fs.existsSync(baseIconPath)) {
      console.error(`❌ Base icon not found: ${baseIconPath}`);
      console.log('\n💡 Please provide a 512x512 PNG icon:');
      console.log('   node scripts/generate-icons.js path/to/your-icon.png');
      process.exit(1);
    }

    console.log('🎨 Generating PWA icons...\n');

    // Generate all icon sizes
    for (const size of sizes) {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      
      await sharp(baseIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${publicDir}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('sharp')) {
      console.log('\n💡 Sharp package not found. Install it with:');
      console.log('   npm install --save-dev sharp');
    }
    
    process.exit(1);
  }
}

// Run the generator
generateIcons();

