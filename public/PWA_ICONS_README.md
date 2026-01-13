# PWA Icons Setup

This application is now configured as a Progressive Web App (PWA). To complete the setup, you need to add PWA icon files to the `/public` directory.

## Required Icons

Place the following icon files in the `/public` directory:

### 1. pwa-192x192.png
- **Size**: 192x192 pixels
- **Format**: PNG
- **Purpose**: Standard PWA icon for mobile devices

### 2. pwa-512x512.png
- **Size**: 512x512 pixels
- **Format**: PNG
- **Purpose**: High-resolution PWA icon, also used as maskable icon

## Generating Icons

You can generate these icons from your app logo using:

### Option 1: Online Tools
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Option 2: Command Line (Sharp)
```bash
npm install --save-dev sharp-cli

# Generate 192x192
npx sharp-cli -i your-logo.png -o public/pwa-192x192.png resize 192 192

# Generate 512x512
npx sharp-cli -i your-logo.png -o public/pwa-512x512.png resize 512 512
```

### Option 3: ImageMagick
```bash
# Generate 192x192
convert your-logo.png -resize 192x192 public/pwa-192x192.png

# Generate 512x512
convert your-logo.png -resize 512x512 public/pwa-512x512.png
```

## Existing Icons

The following icons are already configured:
- ✅ `favicon.ico` - Browser favicon
- ✅ `favicon.svg` - SVG favicon
- ✅ `apple-touch-icon.png` - iOS home screen icon

## Current Status

⚠️ **Action Required**: Add `pwa-192x192.png` and `pwa-512x512.png` to complete PWA setup.

Once these icons are added, your app will be fully installable as a PWA on mobile devices and desktop browsers.
