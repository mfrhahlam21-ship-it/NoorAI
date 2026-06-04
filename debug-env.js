import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== GEMINI ENV DEBUGGING ===\n');

// 1. Check which .env files exist
const envFiles = ['.env', '.env.local', '.env.example'];
console.log('📁 ENV FILES IN DIRECTORY:');
envFiles.forEach(file => {
  const filePath = path.resolve(file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✓' : '✗'} ${file} → ${filePath}`);
});

// 2. Load .env using dotenv
console.log('\n📖 LOADING .env with dotenv.config()...');
const result = dotenv.config();

if (result.error) {
  console.log(`❌ Error loading .env: ${result.error.message}`);
} else {
  console.log(`✓ Successfully loaded from: ${result.path}`);
}

// 3. Show all env variable names (mask sensitive values)
console.log('\n🔑 ALL LOADED ENVIRONMENT VARIABLES:');
const keys = Object.keys(process.env).sort();
const relevantKeys = keys.filter(k =>
  k.includes('GEMINI') || k.includes('API') || k.includes('KEY') || k.includes('NODE') || k.includes('APP')
);

relevantKeys.forEach(key => {
  const value = process.env[key];
  const isSensitive = key.includes('KEY') || key.includes('PASSWORD') || key.includes('TOKEN');

  if (isSensitive && value) {
    const masked = value.substring(0, 5) + '*'.repeat(Math.max(0, value.length - 5));
    console.log(`  ${key}=${masked}`);
  } else if (value) {
    console.log(`  ${key}=${value}`);
  } else {
    console.log(`  ${key}= (EMPTY)`);
  }
});

// 4. Specifically check GEMINI_API_KEY
console.log('\n🎯 GEMINI_API_KEY ANALYSIS:');
const geminiKey = process.env.GEMINI_API_KEY;
console.log(`  Exists in process.env: ${geminiKey !== undefined}`);
console.log(`  Type: ${typeof geminiKey}`);
console.log(`  Value is truthy: ${Boolean(geminiKey)}`);
console.log(`  Length: ${geminiKey ? geminiKey.length : 0} characters`);

if (geminiKey) {
  const first5 = geminiKey.substring(0, 5);
  const masked = first5 + '*'.repeat(Math.max(0, geminiKey.length - 5));
  console.log(`  First 5 chars: ${first5}`);
  console.log(`  Masked: ${masked}`);
} else {
  console.log(`  ❌ Value is: "${geminiKey}" (undefined or empty string)`);
}

// 5. Read .env file directly to show raw content
console.log('\n📄 RAW .env FILE CONTENT:');
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.trim()) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key.includes('GEMINI') || key.includes('API') || key.includes('KEY')) {
        console.log(`  Line ${idx + 1}: ${key}=${value ? '[HAS VALUE]' : '[EMPTY]'}`);
      }
    }
  });
}

// 6. Explain the issue
console.log('\n⚠️  WHY "GEMINI_API_KEY is not defined"?');
if (!geminiKey) {
  console.log(`  ❌ GEMINI_API_KEY is falsy (undefined or empty string)`);
  console.log(`  The server.ts check on line 21 is:`);
  console.log(`    if (apiKey) { /* initialize */ }`);
  console.log(`  Since the value is falsy, it enters the else block and logs the warning.`);
} else {
  console.log(`  ✓ GEMINI_API_KEY has a value and should work!`);
}

console.log('\n=== END DEBUG ===');
