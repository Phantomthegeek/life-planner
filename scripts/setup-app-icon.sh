#!/bin/bash

# Setup App Icon Script
# This script helps you set up your Einstein icon for PWA

echo "🎨 Little Einstein App Icon Setup"
echo "=================================="
echo ""

# Check if sharp is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if input file is provided
if [ -z "$1" ]; then
    echo "📋 Usage: ./scripts/setup-app-icon.sh path/to/your-icon.png"
    echo ""
    echo "💡 Your icon should be:"
    echo "   - At least 512x512 pixels"
    echo "   - Square (1:1 aspect ratio)"
    echo "   - PNG format recommended"
    echo ""
    echo "📁 After running this script, all required icon sizes will be generated in /public"
    exit 1
fi

ICON_PATH="$1"
PUBLIC_DIR="public"

# Check if file exists
if [ ! -f "$ICON_PATH" ]; then
    echo "❌ File not found: $ICON_PATH"
    exit 1
fi

# Check if sharp is installed
if ! npm list sharp &> /dev/null 2>&1; then
    echo "📦 Installing sharp for image processing..."
    npm install --save-dev sharp
fi

echo "✅ Found icon file: $ICON_PATH"
echo "🔄 Generating all required icon sizes..."
echo ""

# Create public directory if it doesn't exist
mkdir -p "$PUBLIC_DIR"

# Icon sizes to generate
sizes=(72 96 128 144 152 192 384 512)

# Check if node script exists, if not create a simple one
if [ ! -f "scripts/generate-icons.js" ]; then
    echo "⚠️  generate-icons.js not found. Creating it..."
    cat > scripts/generate-icons.js << 'EOF'
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const baseIconPath = process.argv[2];
const publicDir = path.join(process.cwd(), 'public');

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      await sharp(baseIconPath)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }
    console.log('\n✨ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateIcons();
EOF
fi

# Run the generation script
node scripts/generate-icons.js "$ICON_PATH"

echo ""
echo "✅ Icon setup complete!"
echo "📁 Icons saved to: $PUBLIC_DIR"
echo ""
echo "🎉 Your Little Einstein app is ready with the new icon!"

