# Pezkuwi SDK UI

**A Portal into the Pezkuwi Blockchain Network**

This is a branded version of Polkadot.js Apps, customized for the Pezkuwi blockchain. It provides a comprehensive interface for interacting with the Pezkuwi network, including wallet management, staking, governance, and blockchain exploration.

## 🎯 Features

- 🔍 **Blockchain Explorer** - Browse blocks, transactions, and chain state
- 💰 **Wallet Management** - Create and manage accounts
- 🎯 **Staking Interface** - Stake tokens and manage validators
- 🗳️ **Governance** - Participate in on-chain governance
- 🔧 **Developer Tools** - Extrinsics, RPC calls, and chain state queries
- 📊 **Analytics** - View network statistics and metrics

## 🌐 Accessing the Application

### Hosted Version
Visit **[https://pezkuwichain.app/sdk](https://pezkuwichain.app/sdk)** to access the hosted version.

### Local Development
See the [Development](#development) section below to run locally.

## 📘 About This Project

This UI is based on [Polkadot.js Apps](https://github.com/polkadot-js/apps) and has been customized for the Pezkuwi blockchain:
- ✅ Pre-configured with Pezkuwi network endpoints (`wss://pezkuwichain.app:9944`)
- ✅ Branded with Pezkuwi logos and colors
- ✅ Optimized for Pezkuwi-specific features and pallets

## 🛠️ Development

### Prerequisites
- Node.js >= 18.14
- Yarn >= 1.22

### Getting Started

1. **Install Dependencies**
   ```bash
   yarn install --frozen-lockfile
   ```

2. **Start Development Server**
   ```bash
   yarn run start
   ```

3. **Access the UI**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
# Build web version
yarn run build:www

# Build desktop app (Electron)
yarn run build:release:electron
```

## 📦 Project Structure

The repo is split into multiple packages:

- `packages/apps` - Main application
- `packages/apps-config` - Chain configurations and endpoints
- `packages/apps-electron` - Desktop application
- `packages/page-*` - Individual page components
- And many more...

## 🔗 Network Configuration

The Pezkuwi network is configured in:
- **File:** `packages/apps-config/src/endpoints/production.ts`
- **Endpoint:** `wss://pezkuwichain.app:9944`
- **Chain Info:** `info: 'pezkuwi'`

## 🎨 Branding & Customization

### Kurdistan Color Palette

Pezkuwi SDK UI uses the Kurdistan flag colors:

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Kesk** (Green) | `#00A94F` | Primary color, main UI elements |
| **Sor** (Red) | `#EE2A35` | Accent color, alerts, important actions |
| **Zer** (Gold/Yellow) | `#FFD700` | Secondary accent, highlights |
| **Spi** (White) | `#FFFFFF` | Backgrounds, cards |
| **Black** | `#000000` | Text, borders |

The primary brand color (Kesk Green `#00A94F`) is used in:
- Chain endpoint configuration (`packages/apps-config/src/endpoints/production.ts`)
- UI theme elements
- Primary buttons and active states

### Updating the Pezkuwi Logo

**Current Status:** Using placeholder logo

**To update:**

1. **Replace the logo file:**
   ```bash
   # Copy your logo to the chains directory
   cp /path/to/pezkuwichain_logo.png packages/apps-config/src/ui/logos/chains/pezkuwi.png
   ```

2. **Run the image conversion script:**
   ```bash
   yarn run build:images
   ```
   This generates TypeScript exports in `packages/apps-config/src/ui/logos/chains/generated/`

3. **Update the endpoint configuration:**
   Edit `packages/apps-config/src/endpoints/production.ts`:
   ```typescript
   import { chainsPezkuwiPNG } from '../ui/logos/chains/index.js';

   // In the Pezkuwi endpoint config:
   ui: {
     color: '#00A94F',
     logo: chainsPezkuwiPNG  // Changed from chainsPolkadotCircleSVG
   }
   ```

### Adding Custom Chain Types

If Pezkuwi uses custom types, add them to:
```
packages/apps-config/src/api/spec/pezkuwi.ts
```

## 🧪 Testing

```bash
# Run all tests
yarn run test:all

# Run specific test
yarn run test:one <test-file>
```

## 📝 Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn build:www` - Build web version
- `yarn build:electron` - Build desktop app
- `yarn lint` - Run linter
- `yarn test` - Run tests

## 🔐 Security

This is a critical application for interacting with the Pezkuwi blockchain. Please:
- Always verify you're on the correct URL
- Keep your private keys secure
- Use hardware wallets for large amounts
- Report security issues to: security@pezkuwichain.app

## 📄 License

Apache-2.0

Original Polkadot.js Apps: https://github.com/polkadot-js/apps

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- **Website:** [https://pezkuwichain.app](https://pezkuwichain.app)
- **Main Web App:** [../web](../web)
- **Issues:** [GitHub Issues](https://github.com/pezkuwichain/pezkuwi-web-app-projects/issues)

---

**Based on Polkadot.js Apps** | Customized for Pezkuwi Blockchain
