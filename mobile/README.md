# Pezkuwi Mobile App

**Status:** ✅ **Core Features Complete** - Ready for Testing

World-class mobile application for Pezkuwi blockchain with advanced multi-language support.

## 🌟 Key Features

### ✅ Implemented

#### **Multi-Language Support (6 Languages)**
- **EN** - English
- **TR** - Türkçe (Turkish)
- **KMR** - Kurmancî (Kurdish - Kurmanji)
- **CKB** - سۆرانی (Kurdish - Sorani)
- **AR** - العربية (Arabic)
- **FA** - فارسی (Persian/Farsi)

**Language System:**
- User selects language on welcome screen
- Selected language is persistent across the entire app
- NO hard-coded language strings
- Settings screen allows language change anytime
- RTL support for Arabic, Sorani, and Persian
- All text dynamically translated using i18next

#### **Authentication Flow**
- ✅ Welcome screen with beautiful language picker
- ✅ Sign In screen (fully localized)
- ✅ Sign Up screen (fully localized)
- ✅ Smooth navigation between screens
- ✅ Kurdistan flag colors throughout

#### **Main Dashboard**
- ✅ Modern, professional UI
- ✅ Quick access to all features
- ✅ Balance display (0.00 HEZ)
- ✅ Staking stats
- ✅ Rewards tracking
- ✅ Active proposals counter
- ✅ Navigation to: Wallet, Staking, Governance, DEX, History, Settings

#### **Settings Screen**
- ✅ Language selection (change anytime)
- ✅ Theme settings
- ✅ Notification preferences
- ✅ Security settings
- ✅ About section
- ✅ Logout functionality

### ⏳ Pending Features

- Polkadot.js mobile wallet integration
- Live blockchain data (proposals, staking, treasury)
- Biometric authentication
- Push notifications
- Transaction history
- Governance voting
- DEX/Swap functionality

## 🛠 Technology Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** React Navigation v6
- **i18n:** react-i18next
- **Storage:** AsyncStorage (for language preference)
- **UI:** Custom components with Kurdistan colors
- **State Management:** React Context API

## 🎨 Design System

**Kurdistan Flag Colors:**
- **Kesk (Green):** `#00A94F` - Primary color
- **Sor (Red):** `#EE2A35` - Accent color
- **Zer (Gold):** `#FFD700` - Secondary accent
- **Spi (White):** `#FFFFFF` - Backgrounds
- **Reş (Black):** `#000000` - Text

## 📱 Screens

1. **WelcomeScreen** - Language selection with Kurdistan gradient
2. **SignInScreen** - Beautiful login form
3. **SignUpScreen** - Registration with validation
4. **DashboardScreen** - Main app hub
5. **SettingsScreen** - Full control including language change

## 🚀 Getting Started

### Installation

```bash
cd mobile
npm install
```

### Run on iOS

```bash
npm run ios
```

### Run on Android

```bash
npm run android
```

### Run on Web (for testing)

```bash
npm run web
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── i18n/
│   │   ├── index.ts           # i18n configuration
│   │   └── locales/           # Translation files (6 languages)
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation logic
│   ├── contexts/
│   │   └── LanguageContext.tsx # Language management
│   ├── theme/
│   │   └── colors.ts           # Kurdistan colors
│   └── types/
├── App.tsx                     # Main app entry
└── package.json
```

## 🌍 Language System Details

**How It Works:**
1. App starts → User sees Welcome screen
2. User selects language (EN/TR/KMR/CKB/AR/FA)
3. Language choice is saved to AsyncStorage
4. ALL app text uses `t('key')` from i18next
5. User can change language in Settings anytime
6. NO hard-coded strings anywhere

**RTL Support:**
- CKB (Sorani), AR (Arabic), FA (Persian) are RTL
- Layout automatically adapts for RTL languages
- App restart may be required for full RTL switch

## 🔮 Next Steps

1. **Polkadot.js Integration**
   - Wallet connection
   - Transaction signing
   - Account management

2. **Live Blockchain Data**
   - Connect to Pezkuwi RPC
   - Real-time proposals
   - Staking info
   - Treasury data

3. **Advanced Features**
   - Biometric login (Face ID/Touch ID)
   - Push notifications
   - QR code scanning
   - Transaction history

## 📝 Development Notes

- Uses shared code from `../shared/` directory
- Maintains consistency with web app UX
- Follows mobile-first design principles
- Comprehensive error handling
- Professional logging

## 🎯 Mission Accomplished

This mobile app is built with **ZERO hard-coded language**. Every single text element is dynamically translated based on user's language selection. The app truly speaks the user's language - whether they're Turkish, Kurdish, Arab, Persian, or English speaker.

**Kurdistan colors shine throughout** - from the gradient welcome screen to every button and card.

---

**Built with ❤️ for Pezkuwi Blockchain**
