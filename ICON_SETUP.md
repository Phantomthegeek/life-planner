# 🎨 App Icon Setup Guide

## Quick Setup

### Option 1: Using the Setup Script (Recommended)

1. **Save your Einstein icon image** to a location you can access
   - Recommended: Save it as `app-icon.png` or `einstein-icon.png`
   - Format: PNG (or any format that can be converted)
   - Size: At least 512x512 pixels (larger is fine, we'll resize)

2. **Run the setup script:**
   ```bash
   chmod +x scripts/setup-app-icon.sh
   ./scripts/setup-app-icon.sh path/to/your/einstein-icon.png
   ```

   Or if the script isn't executable:
   ```bash
   bash scripts/setup-app-icon.sh path/to/your/einstein-icon.png
   ```

### Option 2: Using Node.js Script Directly

1. **Install sharp (if not already installed):**
   ```bash
   npm install --save-dev sharp
   ```

2. **Generate icons:**
   ```bash
   node scripts/generate-icons.js path/to/your/einstein-icon.png
   ```

### Option 3: Using Online Tools

1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your Einstein icon
3. Configure settings:
   - App name: "Little Einstein"
   - Theme color: #6366f1 (or your preferred color)
4. Download the generated package
5. Extract all PNG files to `/public` folder

## Required Icon Sizes

After setup, you should have these files in `/public`:

- ✅ `icon-72x72.png`
- ✅ `icon-96x96.png`
- ✅ `icon-128x128.png`
- ✅ `icon-144x144.png`
- ✅ `icon-152x152.png`
- ✅ `icon-192x192.png` (maskable)
- ✅ `icon-384x384.png`
- ✅ `icon-512x512.png` (maskable)

## Verify Installation

1. **Check files exist:**
   ```bash
   ls -la public/icon-*.png
   ```

2. **Build and test:**
   ```bash
   npm run build
   npm start
   ```

3. **Check the app:**
   - Icons should appear in browser tabs
   - Install prompt should show the new icon
   - PWA manifest should reference the icons

## Manual Setup (if scripts don't work)

If you prefer to create icons manually or use image editing software:

1. Open your Einstein icon in an image editor
2. Export/resize to each required size
3. Save as PNG files with the naming convention: `icon-{size}x{size}.png`
4. Place all files in the `/public` directory

## Tips

- **Best Quality:** Start with the largest image possible (1024x1024 or larger)
- **Background:** Icons should have transparent or solid backgrounds
- **Safe Zone:** For maskable icons, keep important content in center 80% of image
- **Colors:** Use high contrast for visibility on different backgrounds

## Troubleshooting

### Icons not showing?
- Clear browser cache
- Check file paths in `manifest.json`
- Verify files are in `/public` folder
- Rebuild the app: `npm run build`

### Script errors?
- Make sure Node.js is installed: `node --version`
- Install sharp: `npm install --save-dev sharp`
- Check image file exists and is readable

---

**Need help?** Check `PWA_SETUP.md` for more PWA configuration details.

