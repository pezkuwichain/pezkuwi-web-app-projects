# Pezkuwi Web App Projects

Unified repository for all Pezkuwi blockchain frontend applications and shared resources.

## 🏗️ Project Structure

```
pezkuwi-web-app-projects/
├── web/                    # Main web application
├── pezkuwi-sdk-ui/        # Polkadot SDK UI (branded clone)
├── mobile/                 # Mobile application
├── shared/                 # Shared code and utilities
└── README.md              # This file
```

## 📁 Directories

### 1. `web/` - Main Web Application

**Status:** ✅ ~90% Complete - Production Ready

The primary web interface for Pezkuwi blockchain at [pezkuwichain.app](https://pezkuwichain.app)

**Tech Stack:**
- React 18 + TypeScript
- Vite build tool
- Polkadot.js API
- Supabase (Auth & Database)
- Tailwind CSS + shadcn/ui
- i18next (Multi-language support)

**Features:**
- ✅ Wallet integration (Polkadot.js extension)
- ✅ Live blockchain data
- ✅ Staking dashboard
- ✅ DEX/Swap interface
- ✅ Transaction history
- ✅ Multi-language support (EN, TR, KMR, CKB, AR, FA)
- ⏳ Governance dropdown (pending - live blockchain integration)

**Get Started:**
```bash
cd web
npm install
npm run dev
```

### 2. `pezkuwi-sdk-ui/` - Polkadot SDK UI Clone

**Status:** 🚧 Planned - Not Yet Implemented

Branded version of Polkadot.js Apps for Pezkuwi blockchain.

**Purpose:**
- Provide comprehensive blockchain explorer
- Offer advanced developer tools
- Enable direct chain interaction
- Serve as official SDK interface

**Planned Implementation:**
1. Clone Polkadot.js Apps repository
2. Apply Pezkuwi branding
3. Configure chain endpoints
4. Deploy to pezkuwichain.app/sdk

**Resources:**
- See `pezkuwi-sdk-ui/README.md` for details

### 3. `mobile/` - Mobile Application

**Status:** 🚧 In Development - Early Stage (~15% Complete)

Native mobile app for iOS and Android.

**Current Progress:**
- ✅ Welcome screen with language selection
- ✅ Human verification flow
- ✅ Authentication (Sign In/Up)
- ✅ Main dashboard navigation
- ⏳ Wallet integration
- ⏳ Full feature parity with web

**Technology:** TBD (React Native / Flutter / Ionic)

**Get Started:**
- See `mobile/README.md` for current status and plans

### 4. `shared/` - Shared Code

**Status:** ✅ Foundation Ready

Common code, types, and utilities used across all platforms.

**Structure:**
```
shared/
├── types/          # TypeScript type definitions
├── utils/          # Helper functions (formatting, validation)
├── blockchain/     # Blockchain utilities (Polkadot API wrappers)
└── constants/      # App constants and configuration
```

**Usage:**
```typescript
// In web or mobile projects
import { formatAddress } from '../shared/utils';
import { PEZKUWI_NETWORK } from '../shared/blockchain';
import type { WalletAccount } from '../shared/types';
```

## 🎯 Development Roadmap

### Phase 1: Project Organization ✅
- [x] Reorganize repository structure
- [x] Create shared utilities foundation
- [x] Set up placeholder directories

### Phase 2: Polkadot SDK UI (Next)
- [ ] Clone and configure Polkadot.js Apps
- [ ] Apply Pezkuwi branding
- [ ] Set up deployment pipeline
- [ ] Integrate with main web app

### Phase 3: Web App Completion
- [ ] Implement governance dropdown with live data
- [ ] Complete blockchain data integration
- [ ] Production optimization
- [ ] Security audit

### Phase 4: Mobile Development
- [ ] Choose technology stack
- [ ] Implement wallet integration
- [ ] Achieve feature parity with web
- [ ] Beta testing and release

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Clone Repository
```bash
git clone https://github.com/pezkuwichain/pezkuwi-web-app-projects.git
cd pezkuwi-web-app-projects
```

### Run Web App
```bash
cd web
npm install
npm run dev
```

### Build for Production
```bash
cd web
npm run build
```

## 🌐 Multi-Language Support

All applications support:
- 🇬🇧 English (EN)
- 🇹🇷 Türkçe (TR)
- Kurdistan Kurdish - Kurmanji (KMR)
- Kurdistan Kurdish - Sorani (CKB)
- 🇸🇦 العربية (AR)
- 🇮🇷 فارسی (FA)

## 📝 Documentation

- **Web App:** See `web/README.md` and inline documentation
- **SDK UI:** See `pezkuwi-sdk-ui/README.md`
- **Mobile:** See `mobile/README.md`
- **Shared Code:** See `shared/README.md`
- **Architecture:** See `web/mimari.txt` for detailed system architecture

## 🔐 Security

Security is our top priority. See `web/SECURITY.md` for:
- Security policies
- Vulnerability reporting
- Multi-signature wallet setup
- Best practices

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- **Website:** [pezkuwichain.app](https://pezkuwichain.app)
- **Issues:** GitHub Issues
- **Documentation:** Project README files

---

**Note:** This is a monorepo structure designed for production-level deployment of Pezkuwi blockchain applications across multiple platforms.