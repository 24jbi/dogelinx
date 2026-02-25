#!/usr/bin/env node

/**
 * Icon generation script for DogeLinx Studio
 * Usage: node build/generate-icons.js
 * 
 * Requires:
 * - Sharp: npm install sharp
 * - ImageMagick or FFmpeg for advanced conversions (optional)
 */

const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");
const iconSource = path.join(assetsDir, "icon.png");

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`✓ Created assets directory at ${assetsDir}`);
}

// Check if source icon exists
if (!fs.existsSync(iconSource)) {
  console.error(`
  ✗ Source icon not found: ${iconSource}
  
  Please provide a 512x512+ PNG file at assets/icon.png
  
  Optional: Use design software or online tools to create an icon:
  - Figma
  - GIMP
  - Photoshop
  - Canva
  
  Icon requirements:
  - Format: PNG with transparent background
  - Size: At least 512x512 pixels
  - Content: Clear at small sizes (256px and below)
  `);
  process.exit(1);
}

console.log(`✓ Found source icon: ${iconSource}`);
console.log("\nIcon generation:");
console.log("  - PNG: ✓ Already available");
console.log("  - ICO: Requires external tool");
console.log("  - ICNS (macOS): Requires external tool");

console.log(`\nTo generate ICO file:
  npm install --save-dev img2ico
  npx img2ico assets/icon.ico assets/icon.png 256 128 96 64 48 32 16
`);

console.log(`To generate ICNS file (on macOS):
  iconutil -c icns assets/icon.iconset -o assets/icon.icns
`);

console.log("✓ Setup complete. Run 'npm run dist' to build installers.");
