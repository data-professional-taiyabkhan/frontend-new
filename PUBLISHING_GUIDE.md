# MummyHelp Publishing Guide

## 🚀 Publishing to Expo Hosting & Creating APK

This guide will help you publish your MummyHelp app to Expo hosting and create APK files for distribution.

## 📋 Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Already installed globally
3. **Expo Go App**: For testing on devices
4. **Google Play Console**: For publishing APK (optional)

## 🔧 Step-by-Step Publishing Process

### Step 1: Login to Expo

```bash
# Login to your Expo account
eas login
```

### Step 2: Configure Your Project

1. **Update app.json** (already done):
   - Set your Expo username in `"owner"` field
   - Update description and privacy settings

2. **Get Project ID**:
   ```bash
   # This will create a project and give you a project ID
   eas build:configure
   ```

3. **Update the project ID** in `app.json`:
   ```json
   "extra": {
     "eas": {
       "projectId": "your-actual-project-id"
     }
   }
   ```

### Step 3: Publish to Expo Hosting

```bash
# Publish your app to Expo hosting
npx expo publish
```

This will:
- ✅ Upload your app to Expo servers
- ✅ Create a QR code for testing
- ✅ Make it available via Expo Go app
- ✅ Generate a public URL

### Step 4: Create Development Build

```bash
# Create a development build for testing
eas build --profile development --platform android
```

This creates an APK that includes development tools.

### Step 5: Create Preview APK

```bash
# Create a preview APK for testing
eas build --profile preview --platform android
```

This creates a standalone APK that can be installed on any Android device.

### Step 6: Create Production Build

```bash
# Create production build (AAB for Play Store)
eas build --profile production --platform android
```

This creates an Android App Bundle (AAB) for Google Play Store.

## 📱 Testing Your Published App

### Option 1: Expo Go (Easiest)
1. Install Expo Go app on your phone
2. Scan the QR code from `npx expo publish`
3. Test all features

### Option 2: Development Build
1. Download the development APK
2. Install on your device
3. Test with development tools

### Option 3: Preview APK
1. Download the preview APK
2. Install on any Android device
3. Test as a standalone app

## 🔗 Expo Hosting URLs

After publishing, you'll get:
- **QR Code**: For scanning with Expo Go
- **URL**: `exp://exp.host/@your-username/mummyhelp`
- **Web URL**: `https://expo.dev/@your-username/mummyhelp`

## 📦 APK Distribution Options

### 1. Direct APK Installation
- Share the APK file directly
- Users can install via "Unknown Sources"
- Good for testing and small distribution

### 2. Google Play Store
- Upload AAB file to Play Console
- Submit for review
- Available to all Android users

### 3. Alternative App Stores
- Amazon Appstore
- Samsung Galaxy Store
- Huawei AppGallery

## 🛠️ Build Profiles Explained

### Development Profile
```json
"development": {
  "developmentClient": true,
  "distribution": "internal"
}
```
- Includes development tools
- For testing during development
- Larger file size

### Preview Profile
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- Standalone APK
- No development tools
- Smaller file size
- Perfect for testing

### Production Profile
```json
"production": {
  "android": {
    "buildType": "aab"
  }
}
```
- Android App Bundle (AAB)
- Optimized for Play Store
- Smaller download size
- Better performance

## 📊 Build Status Monitoring

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## 🔄 Updating Your App

### 1. Update Version
```json
// In app.json
"version": "1.0.1",
"android": {
  "versionCode": 2
}
```

### 2. Publish Update
```bash
# Publish to Expo hosting
npx expo publish

# Create new build
eas build --profile preview --platform android
```

## 🎯 Quick Commands Reference

```bash
# Login to Expo
eas login

# Configure project
eas build:configure

# Publish to Expo hosting
npx expo publish

# Create preview APK
eas build --profile preview --platform android

# Create production AAB
eas build --profile production --platform android

# List builds
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Submit to stores
eas submit --platform android
```

## 📱 Testing Checklist

### Before Publishing:
- [ ] All features work correctly
- [ ] Voice recognition tested
- [ ] Location tracking tested
- [ ] Emergency alerts tested
- [ ] Pairing system tested
- [ ] UI looks good on different screen sizes
- [ ] No console errors

### After Publishing:
- [ ] App installs correctly
- [ ] All permissions granted
- [ ] Voice features work
- [ ] Location features work
- [ ] Emergency alerts work
- [ ] Pairing works
- [ ] No crashes or errors

## 🔧 Troubleshooting

### Common Issues:

1. **"Build Failed"**
   - Check build logs: `eas build:view [BUILD_ID]`
   - Verify all dependencies are installed
   - Check for syntax errors

2. **"APK Won't Install"**
   - Enable "Unknown Sources" in Android settings
   - Check if device architecture is supported
   - Verify APK file is not corrupted

3. **"Expo Go Can't Load App"**
   - Check internet connection
   - Verify app is published: `npx expo publish`
   - Try clearing Expo Go cache

4. **"Permissions Not Working"**
   - Check app.json permissions
   - Verify runtime permissions are requested
   - Test on physical device (not simulator)

## 📞 Support Resources

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Documentation**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- **Expo Forums**: [forums.expo.dev](https://forums.expo.dev)
- **Discord Community**: [discord.gg/expo](https://discord.gg/expo)

## 🎯 Next Steps

1. **Login to Expo**: `eas login`
2. **Configure Project**: `eas build:configure`
3. **Publish to Expo**: `npx expo publish`
4. **Create Preview APK**: `eas build --profile preview --platform android`
5. **Test on Device**: Install and test all features
6. **Create Production Build**: `eas build --profile production --platform android`
7. **Submit to Stores**: Upload AAB to Google Play Console

---

**Note**: This guide covers the complete process from development to distribution. Start with Expo hosting for easy testing, then create APKs for wider distribution. 