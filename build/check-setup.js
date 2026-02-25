#!/usr/bin/env node

/**
 * Build configuration helper for DogeLinx Studio
 * Validates packaging setup before building installers
 */

const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");
const rootDir = path.join(__dirname, "..");

const checks = {
  icon: {
    file: path.join(assetsDir, "icon.png"),
    name: "App icon (PNG)",
    required: false,
    critical: true,
  },
  icoIcon: {
    file: path.join(assetsDir, "icon.ico"),
    name: "Windows icon (ICO)",
    required: false,
    critical: false,
  },
  packageJson: {
    file: path.join(rootDir, "package.json"),
    name: "package.json with build config",
    required: true,
    critical: true,
  },
  electronMain: {
    file: path.join(rootDir, "electron-main.js"),
    name: "electron-main.js",
    required: true,
    critical: true,
  },
  preload: {
    file: path.join(rootDir, "preload.cjs"),
    name: "preload.cjs",
    required: true,
    critical: true,
  },
  dist: {
    file: path.join(rootDir, "dist"),
    name: "Built app (dist/)",
    required: false,
    critical: false,
    isDir: true,
  },
};

console.log("═══════════════════════════════════════════════════════════");
console.log("  DogeLinx Studio - Build Configuration Check");
console.log("═══════════════════════════════════════════════════════════\n");

let allGood = true;
let criticalMissing = false;

Object.entries(checks).forEach(([key, check]) => {
  const exists = fs.existsSync(check.file);
  const status = exists ? "✓" : "✗";
  const color = exists ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  console.log(`${color}${status}${reset} ${check.name}`);

  if (!exists && check.required) {
    allGood = false;
    if (check.critical) {
      criticalMissing = true;
    }
  }
});

console.log("\n═══════════════════════════════════════════════════════════\n");

if (criticalMissing) {
  console.error("✗ Critical files missing. Cannot proceed.\n");
  process.exit(1);
}

if (!fs.existsSync(path.join(assetsDir, "icon.png"))) {
  console.warn("⚠ Warning: icon.png not found at assets/icon.png");
  console.log(`
Next steps to add an icon:
  1. Create or design a 512x512+ PNG image
  2. Save as: assets/icon.png
  3. Convert to ICO format:
     npm install --save-dev img2ico
     npx img2ico assets/icon.ico assets/icon.png
  
Icon sources:
  - Design tools (Figma, Photoshop, GIMP)
  - Online generators
  - Logo creators
`);
}

if (!fs.existsSync(path.join(assetsDir, "icon.ico"))) {
  console.warn("⚠ Warning: icon.ico not found at assets/icon.ico");
  console.log(`
Windows installers will not have a custom icon.
To fix:
  npm install --save-dev img2ico
  npx img2ico assets/icon.ico assets/icon.png
`);
}

console.log("═══════════════════════════════════════════════════════════");
console.log("  Ready to build!\n");
console.log("Build commands:");
console.log("  npm run build          - Build app with Vite");
console.log("  npm run dist           - Create installers (Windows)");
console.log("  npm run electron:dev   - Build and run locally");
console.log("\n═══════════════════════════════════════════════════════════");
