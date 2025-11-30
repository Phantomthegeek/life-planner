# PWA Setup Guide

Your Little Einstein app is now configured as a Progressive Web App (PWA)! 🎉

## ✅ What's Been Configured

### 1. **Manifest File** (`/public/manifest.json`)
- Complete PWA manifest with all required settings
- App shortcuts for Dashboard, Chat, and Planner
- Multiple icon sizes configured

### 2. **PWA Components**
- **Install Prompt** (`components/pwa/install-prompt.tsx`)
  - Automatic install prompt when users visit your site
  - Beautiful UI with feature highlights
  - Remembers user's choice (won't spam)

- **Offline Indicator** (`components/pwa/offline-indicator.tsx`)
  - Shows notification when user goes offline
  - Displays "back online" message when connection restored

### 3. **Service Worker** (via next-pwa)
- Automatic caching of static assets
- Offline support
- Background sync capabilities
- Runtime caching for better performance

### 4. **Enhanced Metadata**
- Apple Web App meta tags
- Theme colors for light/dark modes
- Open Graph tags for social sharing

## 📱 Next Steps

### 1. Generate Icons (Required)

You need to create icon files for your PWA. Options:

#### Option A: Use the Script (Recommended)
```bash
# First, create or obtain a 512x512 PNG icon
# Then install sharp if needed:
npm install --save-dev sharp

# Generate all icon sizes:
node scripts/generate-icons.js path/to/your-icon-512x512.png
```

#### Option B: Use Online Tools
1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your 512x512 icon
3. Download and extract icons to `/public` folder

#### Option C: Manual Creation
Create these sizes in `/public`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` (maskable)
- `icon-384x384.png`
- `icon-512x512.png` (maskable)

### 2. Test Your PWA

#### Development Mode
PWA is disabled in development by default. To test:
1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Open in browser and check for install prompt

#### Production Testing
1. Deploy your app
2. Visit on a mobile device or desktop browser
3. Look for install prompt or browser install button

### 3. Verify Installation

#### Desktop (Chrome/Edge)
- Look for install icon in address bar
- Or go to Settings → More tools → Create shortcut

#### Mobile (iOS)
- Safari: Share → Add to Home Screen
- Chrome: Menu → Install app

#### Mobile (Android)
- Chrome: Menu → Install app
- Address bar will show install prompt

## 🎨 Customization

### Change Theme Color
Edit `/public/manifest.json`:
```json
"theme_color": "#YOUR_COLOR"
```

Also update in `app/layout.tsx` metadata:
```typescript
themeColor: [
  { media: '(prefers-color-scheme: light)', color: '#YOUR_COLOR' },
  { media: '(prefers-color-scheme: dark)', color: '#YOUR_COLOR' },
],
```

### Modify Install Prompt
Edit `components/pwa/install-prompt.tsx` to customize:
- Appearance
- Timing (currently shows after 3 seconds)
- Dismissal period (currently 7 days)

### Adjust Caching Strategy
Edit `next.config.js` to modify:
- Cache expiration times
- Caching strategies
- Offline behavior

## 🔍 PWA Features

### Offline Support
- App works offline (cached pages)
- Service worker handles requests
- Offline indicator shows status

### Installable
- Users can install on home screen
- Works like native app
- Standalone display mode

### Fast Loading
- Cached assets load instantly
- Smart caching strategies
- Background updates

### App Shortcuts
- Quick access to Dashboard, Chat, Planner
- Right-click app icon (desktop)
- Long-press app icon (mobile)

## 🐛 Troubleshooting

### Install Prompt Not Showing
1. Check if already installed (uninstall first)
2. Ensure you're on HTTPS (required for PWA)
3. Clear browser cache and service workers
4. Check browser console for errors

### Icons Not Displaying
1. Verify icon files exist in `/public`
2. Check manifest.json paths are correct
3. Clear browser cache
4. Regenerate icons

### Service Worker Issues
1. Clear service workers in DevTools → Application
2. Check `next.config.js` PWA settings
3. Rebuild app: `npm run build`

### Development Mode
PWA is disabled in development by default. To enable:
1. Set `disable: false` in `next.config.js`
2. Or test with production build

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Next-PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Manifest Reference](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## ✨ Features Ready to Use

Your PWA now includes:
- ✅ Install prompt
- ✅ Offline support
- ✅ Service worker caching
- ✅ App shortcuts
- ✅ Theme colors
- ✅ Responsive design
- ✅ Fast loading

Enjoy your new PWA! 🚀

