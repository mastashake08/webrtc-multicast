#!/bin/bash

# PWA Icon Generator Script
# This script generates PWA icons from your existing favicon.svg

echo "🎨 PWA Icon Generator"
echo "===================="
echo ""

# Check if favicon.svg exists
if [ ! -f "public/favicon.svg" ]; then
    echo "❌ Error: public/favicon.svg not found!"
    echo "   Please ensure you have a favicon.svg file in the public directory."
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Checking for alternative methods..."
    
    # Check for Node.js sharp-cli
    if command -v npx &> /dev/null; then
        echo "✅ Node.js found. Installing sharp-cli..."
        npm install --save-dev sharp-cli
        
        echo ""
        echo "📦 Generating icons with sharp-cli..."
        npx sharp-cli -i public/favicon.svg -o public/pwa-192x192.png resize 192 192
        npx sharp-cli -i public/favicon.svg -o public/pwa-512x512.png resize 512 512
        
        echo ""
        echo "✅ PWA icons generated successfully!"
        echo "   - public/pwa-192x192.png"
        echo "   - public/pwa-512x512.png"
        exit 0
    else
        echo "❌ No suitable tool found to generate icons."
        echo ""
        echo "Please install one of the following:"
        echo "  1. ImageMagick: brew install imagemagick (macOS)"
        echo "  2. Node.js with npx (for sharp-cli)"
        echo ""
        echo "Or generate icons manually using:"
        echo "  - https://www.pwabuilder.com/imageGenerator"
        echo "  - https://realfavicongenerator.net/"
        exit 1
    fi
fi

# Generate icons with ImageMagick
echo "📦 Generating icons with ImageMagick..."
echo ""

# Generate 192x192
echo "Creating pwa-192x192.png..."
convert public/favicon.svg -resize 192x192 -background none -flatten public/pwa-192x192.png

# Generate 512x512
echo "Creating pwa-512x512.png..."
convert public/favicon.svg -resize 512x512 -background none -flatten public/pwa-512x512.png

echo ""
echo "✅ PWA icons generated successfully!"
echo "   - public/pwa-192x192.png"
echo "   - public/pwa-512x512.png"
echo ""
echo "🚀 Your app is now ready to be installed as a PWA!"
