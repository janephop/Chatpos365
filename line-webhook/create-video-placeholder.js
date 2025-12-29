// Create a simple video placeholder image
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');

// Simple 1x1 pixel black PNG (base64)
const blackPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Create video-placeholder.jpg
const placeholderPath = path.join(uploadsDir, 'video-placeholder.jpg');
fs.writeFileSync(placeholderPath, blackPixel);

console.log('✅ Created video placeholder:', placeholderPath);

