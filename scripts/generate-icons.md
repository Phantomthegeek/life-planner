# PWA Icon Generation Guide

To generate the required PWA icons, you can use any of these methods:

## Method 1: Using Online Tools (Recommended)

1. Go to [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your base icon (create a 512x512 PNG with your app logo)
3. Generate all sizes
4. Download and place in `/public` folder

## Method 2: Using ImageMagick

If you have ImageMagick installed:

```bash
# Create a 512x512 base icon first (icon-512x512.png)
# Then run these commands from the public directory:

convert icon-512x512.png -resize 72x72 icon-72x72.png
convert icon-512x512.png -resize 96x96 icon-96x96.png
convert icon-512x512.png -resize 128x128 icon-128x128.png
convert icon-512x512.png -resize 144x144 icon-144x144.png
convert icon-512x512.png -resize 152x152 icon-152x152.png
convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 384x384 icon-384x384.png
```

## Method 3: Using Sharp (Node.js)

Create a script to generate icons programmatically using Sharp.

## Required Icon Sizes

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (maskable)
- 384x384
- 512x512 (maskable)

## Icon Requirements

- Use a square image (1:1 aspect ratio)
- Use PNG format
- For maskable icons (192x192 and 512x512): Keep important content in the center 80% of the image (safe zone)
- Background should be solid or transparent
- Use high contrast colors for visibility

