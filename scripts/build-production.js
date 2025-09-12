#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building MummyHelp Frontend for Production...');

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'pipe' });
  console.log('✅ EAS CLI is installed');
} catch (error) {
  console.error('❌ EAS CLI is not installed. Please install it first:');
  console.error('   npm install -g @expo/eas-cli');
  console.error('   eas login');
  process.exit(1);
}

// Check if user is logged in to Expo
try {
  execSync('eas whoami', { stdio: 'pipe' });
  console.log('✅ Logged in to Expo');
} catch (error) {
  console.error('❌ Not logged in to Expo. Please run: eas login');
  process.exit(1);
}

// Check if eas.json exists
const easConfigPath = path.join(__dirname, '../eas.json');
if (!fs.existsSync(easConfigPath)) {
  console.error('❌ eas.json not found. Please configure EAS build first.');
  process.exit(1);
}

// Build for Android
console.log('\n📱 Building for Android...');
try {
  execSync('eas build --platform android --profile production --non-interactive', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Android build completed successfully!');
} catch (error) {
  console.error('❌ Android build failed:', error.message);
  process.exit(1);
}

// Build for iOS (if on macOS)
if (process.platform === 'darwin') {
  console.log('\n🍎 Building for iOS...');
  try {
    execSync('eas build --platform ios --profile production --non-interactive', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ iOS build completed successfully!');
  } catch (error) {
    console.error('❌ iOS build failed:', error.message);
    console.log('⚠️  iOS build failed, but Android build succeeded');
  }
} else {
  console.log('\n🍎 Skipping iOS build (not on macOS)');
}

console.log('\n🎉 Production builds completed!');
console.log('\n📋 Next steps:');
console.log('   1. Check your builds in the Expo dashboard');
console.log('   2. Download the builds when ready');
console.log('   3. Test the builds on real devices');
console.log('   4. Submit to app stores:');
console.log('      - Android: npm run submit:android');
console.log('      - iOS: npm run submit:ios');
console.log('\n🔗 Expo Dashboard: https://expo.dev');
