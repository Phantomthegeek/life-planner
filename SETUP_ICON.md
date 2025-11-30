# 🎨 Use Your Einstein Icon

## Quick Start

### Step 1: Save Your Icon Image
1. Right-click on the Einstein icon image you have
2. Save it to your computer
3. Recommended location: Save it in the project folder as `einstein-icon.png` or in your Downloads folder

### Step 2: Generate All Icon Sizes

**Option A: Easy Script (Recommended)**
```bash
# Make sure you're in the project directory
cd "/Users/user/Desktop/life planner"

# Run the setup script (replace with your actual file path)
./scripts/setup-app-icon.sh ~/Downloads/einstein-icon.png

# Or if saved in project folder:
./scripts/setup-app-icon.sh ./einstein-icon.png
```

**Option B: Node.js Script**
```bash
# First install sharp if needed
npm install --save-dev sharp

# Then generate icons
node scripts/generate-icons.js path/to/einstein-icon.png
```

### Step 3: Verify
After running, check that icons were created:
```bash
ls -la public/icon-*.png
```

You should see 8 icon files (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)

### Step 4: Test
```bash
npm run build
npm start
```

The icon will now appear:
- In browser tabs
- In the install prompt
- When installed as a PWA
- On mobile home screens

---

## Need Help?

**Can't find your image?**
- Check your Downloads folder
- Or save it again with a name you remember (like `einstein-icon.png`)

**Script not working?**
- Make sure you have Node.js installed: `node --version`
- Try: `npm install --save-dev sharp` first
- Check the file path is correct

**Icons not showing?**
- Clear browser cache (Cmd+Shift+R on Mac)
- Rebuild the app: `npm run build`
- Check files are in `/public` folder

---

That's it! Your Little Einstein app will now use your custom Einstein icon! 🚀

