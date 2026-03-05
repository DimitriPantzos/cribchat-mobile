# CribChat Mobile 📱

iOS app for CribChat - Your AI sleep training companion.

## ✅ What's Done

- **Expo project** with expo-router (file-based routing)
- **Clerk authentication** (sign-in, sign-up, verification)
- **Convex backend** (shared with web app!)
- **4 core screens**:
  - 🏠 **Home** - Dashboard with SweetSpot nap predictions
  - ⏱️ **Timer** - Ferber cry timer with background resilience
  - 💬 **Chat** - AI sleep coaching
  - ⚙️ **Settings** - Profile, preferences
- **Onboarding** - Baby profile setup
- **Theme system** - Light/dark mode with CribChat branding
- **EAS build configuration**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /root/clawd/projects/cribchat-mobile
npm install
```

### 2. Environment Variables

The `.env.local` file is already configured with:
- Clerk publishable key
- Convex URL (same as web app)

### 3. Run Development Server

```bash
npx expo start
```

Then:
- Press `i` for iOS simulator
- Scan QR code with Expo Go on your phone

## 📱 Building for iOS App Store

### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to Expo
eas login

# Initialize EAS (first time only)
cd /root/clawd/projects/cribchat-mobile
eas init
```

### First Build Steps

1. **Update `eas.json`** with your credentials:
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@email.com",
           "ascAppId": "your-app-store-connect-app-id",
           "appleTeamId": "YOUR_TEAM_ID"
         }
       }
     }
   }
   ```

2. **Create development build** (for testing with dev client):
   ```bash
   eas build --profile development --platform ios
   ```

3. **Create preview build** (for TestFlight internal testing):
   ```bash
   eas build --profile preview --platform ios
   ```

4. **Create production build**:
   ```bash
   eas build --profile production --platform ios
   ```

5. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

## 📂 Project Structure

```
cribchat-mobile/
├── app/                      # expo-router pages
│   ├── _layout.tsx           # Root layout (Clerk + Convex providers)
│   ├── index.tsx             # Entry point (redirects)
│   ├── auth/                 # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/               # Tab navigator
│   │   ├── _layout.tsx       # Tab bar config
│   │   ├── home.tsx          # Dashboard
│   │   ├── timer.tsx         # Cry timer
│   │   ├── chat.tsx          # AI chat
│   │   └── settings.tsx
│   └── onboarding/           # Baby profile setup
│       └── index.tsx
├── convex/                   # Convex backend (shared with web)
│   ├── schema.ts
│   ├── users.ts
│   ├── children.ts
│   ├── crySessions.ts
│   └── ...
├── lib/                      # Utilities
│   ├── theme.ts              # Colors, spacing, typography
│   ├── wakeWindows.ts        # Sleep science
│   ├── scheduleGenerator.ts
│   └── tokenCache.ts         # Clerk secure storage
├── app.config.ts             # Expo configuration
├── eas.json                  # EAS Build profiles
└── package.json
```

## 🎯 Key Features

### Cry Timer (Ferber Sleep Training)
- **Background-resilient**: Uses timestamps, not intervals
- **Haptic feedback** and alerts when interval completes
- **Customizable intervals**: Default 5→10→15→15
- **Session tracking**: Saves to Convex for history

### AI Chat
- **Context-aware**: Uses baby's age and schedule
- **Wake window guidance**: Age-appropriate recommendations
- **Simulated responses** (connect to OpenAI via Convex action for production)

### Dashboard
- **SweetSpot predictions**: Next nap time based on wake windows
- **Quick logging**: Wake time, sleep tracking
- **Active session indicators**: Shows when baby is napping

## 🔑 Bundle ID

`com.lyfehospitality.cribchat`

## 📋 Pre-Launch Checklist

- [ ] `eas init` to create EAS project
- [ ] Update `app.config.ts` with EAS project ID
- [ ] Create app in App Store Connect
- [ ] Configure Apple Developer credentials in `eas.json`
- [ ] Add app icons (replace assets/icon.png)
- [ ] Add splash screen (replace assets/splash-icon.png)
- [ ] Test on real device with TestFlight
- [ ] Submit for App Store Review

## 🤝 Shared Backend

This mobile app uses the **exact same Convex backend** as the web app. All data syncs:
- User accounts
- Baby profiles
- Chat history
- Sleep/timer sessions
- Subscriptions

No backend changes needed - the mobile app is a new client to the existing API.
