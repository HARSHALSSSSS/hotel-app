// Creates a minimal valid MP3 file (silent/short) for ringtone placeholder
// Using a known minimal MP3 frame structure - 417 bytes for 128kbps MPEG-1
const fs = require('fs');
const path = require('path');

// Minimal MP3 frame bytes (MPEG1 Layer III, 128kbps, 44.1kHz - one frame ~26ms)
// This is a simplified structure - actual decoders may need more
const minimalMp3 = Buffer.from([
  0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  // Padding to reach typical min frame size - repeat pattern for a "ring" feel
  ...Array(400).fill(0)
].slice(0, 417));

const outDir = path.join(__dirname, '..', 'assets', 'audio');
const outPath = path.join(outDir, 'ringtone.mp3');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, minimalMp3);
console.log('Created', outPath);
