#!/usr/bin/env node

// Simple script to verify environment variables are loaded correctly
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Environment Variable Check ===\n');

// Read .env file
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');

console.log('📄 .env File Contents:');
console.log('─'.repeat(50));
envContent.split('\n').forEach((line, i) => {
  if (line.trim()) {
    const [key, value] = line.split('=');
    const maskedValue = value && value.length > 8
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`${i + 1}. ${key} = ${maskedValue}`);
  }
});
console.log('─'.repeat(50));

// Check for specific variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_POLYGON_API_KEY'
];

console.log('\n✓ Required Variables Check:');
requiredVars.forEach(varName => {
  const found = envContent.includes(varName);
  console.log(`  ${found ? '✓' : '✗'} ${varName}: ${found ? 'FOUND' : 'MISSING'}`);
});

console.log('\n=== Next Steps ===');
console.log('1. Restart the dev server if running (Ctrl+C then npm run dev)');
console.log('2. Open browser console when app loads');
console.log('3. Look for "Polygon API Key Detection" section in console');
console.log('4. Navigate to Options Chain page');
console.log('5. Verify badge shows "Live Data Available"');
console.log('6. Click "Sync Data" button to fetch real data\n');
