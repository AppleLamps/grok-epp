#!/usr/bin/env node
/**
 * Setup Verification Script
 * Checks if all requirements are met for the website to run
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Node modules
console.log('1. Checking dependencies...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('   ✅ node_modules found');
} else {
  console.log('   ❌ node_modules NOT found - Run: npm install');
  hasErrors = true;
}

// Check 2: Environment variables
console.log('\n2. Checking environment variables...');
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  console.log('   ✅ .env.local found');

  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');

  if (envContent.includes('XAI_API_KEY=') && !envContent.includes('XAI_API_KEY=your_')) {
    console.log('   ✅ XAI_API_KEY is set');
  } else {
    console.log('   ❌ XAI_API_KEY is not properly set in .env.local');
    hasErrors = true;
  }

  if (envContent.includes('XAI_MANAGEMENT_API_KEY=')) {
    console.log('   ℹ️  XAI_MANAGEMENT_API_KEY is set (optional for website)');
  }
} else {
  console.log('   ❌ .env.local NOT found');
  console.log('   📝 Copy .env.local.example to .env.local and add your API key');
  hasErrors = true;
}

// Check 3: TypeScript configuration
console.log('\n3. Checking TypeScript configuration...');
if (fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
  console.log('   ✅ tsconfig.json found');
} else {
  console.log('   ❌ tsconfig.json NOT found');
  hasErrors = true;
}

// Check 4: Next.js configuration
console.log('\n4. Checking Next.js configuration...');
if (fs.existsSync(path.join(__dirname, 'next.config.js'))) {
  console.log('   ✅ next.config.js found');
} else {
  console.log('   ⚠️  next.config.js NOT found');
  hasWarnings = true;
}

// Check 5: Required files
console.log('\n5. Checking required files...');
const requiredFiles = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/api/chat/route.ts',
  'components/ChatInput.tsx',
  'components/ChatMessage.tsx',
  'types/index.ts',
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NOT found`);
    allFilesExist = false;
    hasErrors = true;
  }
});

// Check 6: Collection ID
console.log('\n6. Checking Collection ID configuration...');
const routeFile = path.join(__dirname, 'app/api/chat/route.ts');
if (fs.existsSync(routeFile)) {
  const routeContent = fs.readFileSync(routeFile, 'utf-8');
  if (routeContent.includes('collection_8b792b21-5c87-47c6-901b-0395a6589e33')) {
    console.log('   ✅ Collection ID is configured');
  } else {
    console.log('   ⚠️  Collection ID might not be configured correctly');
    hasWarnings = true;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (!hasErrors && !hasWarnings) {
  console.log('✅ All checks passed! Your setup is ready.');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:3000');
  console.log('   3. Start chatting with your collection!');
} else if (hasErrors) {
  console.log('❌ Setup has errors that need to be fixed.');
  console.log('\n📝 Fix the errors above, then run this script again.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup has warnings but should work.');
  console.log('\n📝 You can proceed, but consider addressing the warnings.');
}

console.log('='.repeat(60));
