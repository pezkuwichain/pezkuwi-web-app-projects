# CLAUDE.md - AI Assistant Guide for PezkuwiChain Web App Projects

**Last Updated:** 2025-11-17
**Production Status:** ~95% Complete
**Active Network:** Beta Testnet (`wss://rpc.pezkuwichain.io:9944`)

---

## 🎯 Quick Start for AI Assistants

This is a **production-grade blockchain monorepo** for PezkuwiChain with live validators running on VPS. Exercise extreme caution when making changes that could affect blockchain operations.

### Critical Rules (READ FIRST!)

⚠️ **NEVER DO THESE WITHOUT EXPLICIT USER PERMISSION:**
1. **DO NOT** restart or stop VPS validators (7 validators currently finalizing blocks)
2. **DO NOT** modify chain specs (`/root/pezkuwi-sdk/chain-specs/beta/beta-testnet-raw.json`)
3. **DO NOT** change blockchain base paths or validator configurations
4. **DO NOT** commit `.env` files or secrets to git
5. **DO NOT** deploy to production without testing locally first
6. **DO NOT** make assumptions about blockchain operations - **ALWAYS ASK**

### VPS Infrastructure

- **IP:** 37.60.230.9
- **Validators:** 7 running (ports 30333-30339, RPC 9944-9950)
- **Frontend:** Nginx serving at `/var/www/pezkuwichain/web/dist/`
- **Blockchain:** LIVE on Beta Testnet - handle with care

---

## 📁 Repository Structure

```
pezkuwi-web-app-projects/
├── web/                    # Main React web app (Vite + TypeScript) - 90% complete
├── mobile/                 # React Native Expo app - 50% complete
├── pezkuwi-sdk-ui/        # Polkadot.js SDK UI (branded clone) - 47MB
├── shared/                 # Shared code library (types, utils, blockchain, i18n)
├── README.md              # Project overview
├── PRODUCTION_READINESS.md # Production status report
└── CLAUDE_README_KRITIK.md # CRITICAL operational guidelines (Turkish)
```

### Directory Breakdown

| Directory | Size | Status | Purpose |
|-----------|------|--------|---------|
| `web/` | 3.8MB | 90% | Main production web application |
| `mobile/` | 737KB | 50% | iOS/Android mobile app |
| `pezkuwi-sdk-ui/` | 47MB | Active | Polkadot.js Apps clone |
| `shared/` | 402KB | 100% | Shared libraries & utilities |

---

## 🛠️ Tech Stack

### Web Application (`/web/`)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI framework |
| **Language** | TypeScript | 5.5.3 | Type safety |
| **Build Tool** | Vite | 5.4.1 | Fast bundler with HMR |
| **Blockchain** | Polkadot.js API | 16.4.9 | Blockchain integration |
| **Backend** | Supabase | 2.49.4 | Auth & Database |
| **UI Library** | shadcn/ui | Latest | Radix UI components |
| **Styling** | Tailwind CSS | 3.4.11 | Utility-first CSS |
| **State** | React Context | - | Global state management |
| **Data Fetching** | TanStack Query | 5.56.2 | Server state caching |
| **Routing** | React Router | 6.26.2 | Client-side routing |
| **i18n** | i18next | 23.7.6 | 6-language support |
| **Forms** | React Hook Form | 7.53.0 | Form management |
| **Validation** | Zod | 3.23.8 | Schema validation |
| **Charts** | Recharts | 2.12.7 | Data visualization |
| **Icons** | Lucide React | 0.462.0 | Icon library |
| **Notifications** | Sonner | 1.5.0 | Toast notifications |

### Mobile Application (`/mobile/`)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React Native | 0.81.5 | Mobile framework |
| **Runtime** | Expo | 54.0.23 | Development platform |
| **Navigation** | React Navigation | 7.x | Native navigation |
| **Blockchain** | Polkadot.js API | 16.5.2 | Blockchain integration |
| **Storage** | AsyncStorage | 2.2.0 | Persistent storage |
| **Security** | Expo SecureStore | 15.0.7 | Encrypted storage |
| **Biometrics** | expo-local-authentication | 17.0.7 | Fingerprint/FaceID |
| **i18n** | i18next | 25.6.2 | Multi-language |

### Shared Library (`/shared/`)

- **Language:** TypeScript (100% typed)
- **Runtime:** Platform-agnostic (Node.js + Browser + React Native)
- **Dependencies:** Minimal (Polkadot.js only)

---

## 🔑 Key Files & Entry Points

### Web Application

**Entry Points:**
- `web/src/main.tsx` - React root render
- `web/src/App.tsx` - Provider hierarchy & routing
- `web/index.html` - HTML template

**Configuration:**
- `web/vite.config.ts` - Vite bundler config with path aliases
- `web/tailwind.config.ts` - Tailwind with Kurdistan color theme
- `web/tsconfig.json` - TypeScript strict mode + path mappings
- `web/postcss.config.js` - PostCSS for Tailwind

**State Management (6 Contexts):**
- `contexts/PolkadotContext.tsx` - Blockchain API connection
- `contexts/WalletContext.tsx` - Wallet state & multi-token balances
- `contexts/AuthContext.tsx` - Supabase authentication
- `contexts/AppContext.tsx` - Global application state
- `contexts/WebSocketContext.tsx` - Real-time blockchain updates
- `contexts/IdentityContext.tsx` - User identity & KYC status

**Backend:**
- `src/lib/supabase.ts` - Supabase client initialization
- `supabase/migrations/*.sql` - Database schema migrations (9 files)

### Mobile Application

**Entry Points:**
- `mobile/index.ts` - Expo registerRootComponent
- `mobile/App.tsx` - Root with i18n initialization
- `mobile/src/navigation/AppNavigator.tsx` - Navigation setup

### Shared Library

**Core Files:**
- `shared/blockchain/endpoints.ts` - Network endpoint configurations
- `shared/blockchain/polkadot.ts` - Polkadot.js utilities
- `shared/constants/index.ts` - KNOWN_TOKENS, KURDISTAN_COLORS, LANGUAGES
- `shared/i18n/index.ts` - i18n configuration
- `shared/types/blockchain.ts` - Blockchain type definitions
- `shared/lib/wallet.ts` - Wallet utilities & formatters

**Business Logic Libraries:**
- `shared/lib/citizenship-workflow.ts` - KYC & citizenship workflow
- `shared/lib/tiki.ts` - 70+ government roles (Hemwelatî, Parlementer, etc.)
- `shared/lib/perwerde.ts` - Education platform logic
- `shared/lib/p2p-fiat.ts` - P2P fiat trading system (production-ready)
- `shared/lib/staking.ts` - Staking operations
- `shared/lib/multisig.ts` - Multisig treasury operations
- `shared/lib/validator-pool.ts` - Validator pool management

---

## 🚀 Development Workflows

### Web Development

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start development server (localhost:8081)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

**Environment Setup:**
1. Copy `.env.example` to `.env`
2. Set `VITE_NETWORK=local` (or testnet/beta/mainnet)
3. Configure Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Set blockchain endpoint (optional, defaults to beta)

### Mobile Development

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Run in web browser
npm run web
```

### Deploying to Production (Web)

```bash
# 1. Build locally
cd /home/mamostehp/pwap/web
npm run build

# 2. Deploy to VPS
rsync -avz dist/ pezkuwi-vps:/var/www/pezkuwichain/web/dist/

# 3. Reload Nginx (no restart needed)
ssh pezkuwi-vps "systemctl reload nginx"
```

**Important:** Always test locally with `npm run build && npm run preview` before deploying to VPS.

---

## 📂 Code Organization Patterns

### Component Structure

**Web Components:**
```
web/src/components/
├── ui/                 # shadcn/ui primitives (50+ components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── auth/               # Authentication components
├── citizenship/        # Citizenship/KYC UI
├── dex/                # DEX/Swap interface
├── delegation/         # Delegation management
├── forum/              # Forum components
├── governance/         # Governance interface
├── p2p/                # P2P fiat trading
├── perwerde/           # Education platform
├── staking/            # Staking dashboard
└── wallet/             # Wallet components
```

**Pattern:** Feature-based organization with co-located types and utilities.

### File Naming Conventions

- **Components:** PascalCase (`StakingDashboard.tsx`)
- **Utilities:** camelCase (`wallet.ts`, `formatting.ts`)
- **Types:** PascalCase interfaces/types (`WalletAccount`, `TokenInfo`)
- **Constants:** UPPER_SNAKE_CASE exports (`ASSET_IDS`, `KURDISTAN_COLORS`)

### Import Patterns

**Path Aliases (Web):**
```typescript
// Local imports
import { Component } from '@/components/ui/component';
import { useWallet } from '@/contexts/WalletContext';

// Shared library imports
import { formatBalance } from '@pezkuwi/lib/wallet';
import { WalletAccount } from '@pezkuwi/types';
import { KURDISTAN_COLORS } from '@pezkuwi/constants';
import { translations } from '@pezkuwi/i18n';
```

**Import Order (Follow This!):**
1. React imports
2. External libraries
3. Shared imports (`@pezkuwi/*`)
4. Local imports (`@/`)
5. Types
6. Styles/assets

**Example:**
```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatBalance } from '@pezkuwi/lib/wallet';
import { WalletAccount } from '@pezkuwi/types';
import { ASSET_IDS } from '@pezkuwi/constants';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import type { PoolInfo } from '@/types/dex';
import '@/styles/dashboard.css';
```

### TypeScript Conventions

**Strict Mode Enabled:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Type Patterns:**
- Use `interface` for object shapes
- Use `type` for unions, intersections, and complex types
- Use `enum` for fixed sets of values
- Use `as const` for literal types
- Avoid `any` - use `unknown` and type guards instead

---

## ⛓️ Blockchain Integration

### Network Endpoints

```typescript
// shared/blockchain/endpoints.ts
const ENDPOINTS = {
  MAINNET: 'wss://mainnet.pezkuwichain.io',
  BETA: 'wss://rpc.pezkuwichain.io:9944',      // Currently active
  STAGING: 'wss://staging.pezkuwichain.io',
  TESTNET: 'wss://testnet.pezkuwichain.io',
  LOCAL: 'ws://127.0.0.1:9944'
};

// Default for development
DEFAULT_ENDPOINT = 'ws://127.0.0.1:9944';
```

### Asset System

**⚠️ CRITICAL: wUSDT uses 6 decimals, not 12!**

```typescript
// Native token (no Asset ID)
HEZ - Accessed via system.account.data.free

// Assets pallet (12 decimals except wUSDT)
ASSET_IDS = {
  WHEZ: 0,   // Wrapped HEZ - 12 decimals
  PEZ: 1,    // Utility token - 12 decimals
  WUSDT: 2,  // Wrapped USDT - 6 decimals ⚠️
}

// Display mapping (internal vs user-facing)
TOKEN_DISPLAY_SYMBOLS = {
  'wHEZ': 'HEZ',   // Show as HEZ to users
  'wUSDT': 'USDT', // Show as USDT to users
  'PEZ': 'PEZ'     // Keep as PEZ
}
```

### Polkadot.js Connection Pattern

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';

// Initialize API
const provider = new WsProvider(endpoint);
const api = await ApiPromise.create({ provider });
await api.isReady;

// Query native balance
const { data } = await api.query.system.account(address);
const balance = data.free.toString();

// Query asset balance
const assetData = await api.query.assets.account(ASSET_IDS.PEZ, address);
const amount = assetData.unwrap().balance.toString();
```

### Transaction Pattern

```typescript
// Simple transaction
const extrinsic = api.tx.balances.transfer(dest, amount);
const hash = await extrinsic.signAndSend(account, { signer });

// With event handling
const result = await new Promise((resolve, reject) => {
  let unsub;

  api.tx.module.method(params)
    .signAndSend(account, { signer }, ({ status, events, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        if (unsub) unsub();
        return;
      }

      if (status.isInBlock) {
        // Extract data from events
        const event = events.find(e =>
          e.event.section === 'module' &&
          e.event.method === 'EventName'
        );
        resolve(event.data[0].toString());
        if (unsub) unsub();
      }
    })
    .then(unsubscribe => { unsub = unsubscribe; });
});
```

### Custom Pallets

1. **pallet-tiki** - Governance roles (70+ roles: Hemwelatî, Parlementer, Serok, Wezir, etc.)
2. **pallet-identity-kyc** - Zero-knowledge citizenship & KYC
3. **pallet-perwerde** - Education platform (courses, enrollments, certificates)
4. **pallet-validator-pool** - Validator pool categories & staking
5. **pallet-welati** - P2P fiat trading with escrow

---

## 🎨 UI Patterns & Styling

### shadcn/ui Components

Located in `web/src/components/ui/` - 50+ components built on Radix UI primitives.

**Component Variants (CVA Pattern):**
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-kurdish-green text-white',
        destructive: 'bg-kurdish-red text-white',
        outline: 'border border-input bg-background',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    }
  }
);
```

### Kurdistan Color System

**Primary Colors:**
```typescript
KURDISTAN_COLORS = {
  kesk: '#00A94F',  // Green (Kesk) - Primary brand color
  sor: '#EE2A35',   // Red (Sor) - Danger/error
  zer: '#FFD700',   // Yellow/Gold (Zer) - Warning/accent
  spi: '#FFFFFF',   // White (Spî)
  res: '#000000',   // Black (Reş)
}
```

**Tailwind Usage:**
```css
bg-kurdish-green
bg-kurdish-green-dark
bg-kurdish-green-light
text-kurdish-red
border-kurdish-yellow
```

---

## 🌍 Internationalization (i18n)

### Supported Languages

| Code | Language | Direction | Status |
|------|----------|-----------|--------|
| `en` | English | LTR | ✅ Complete |
| `tr` | Türkçe (Turkish) | LTR | ✅ Complete |
| `kmr` | Kurmancî (Kurdish Kurmanji) | LTR | ✅ Complete |
| `ckb` | سۆرانی (Kurdish Sorani) | RTL | ✅ Complete |
| `ar` | العربية (Arabic) | RTL | ✅ Complete |
| `fa` | فارسی (Persian) | RTL | ✅ Complete |

### Translation Files

- **Web:** `web/src/i18n/locales/*.ts` (TypeScript modules - local imports)
- **Mobile:** `mobile/src/i18n/locales/*.ts`
- **Shared:** `shared/i18n/locales/*.json` (JSON files)

**⚠️ Important:** Web uses `.ts` files with local imports, not shared JSON files. This was changed to fix loading issues.

### RTL Support

```typescript
import { isRTL } from '@pezkuwi/i18n';

// Detect RTL languages
const isRightToLeft = isRTL(currentLanguage); // true for ckb, ar, fa

// Apply direction
document.dir = isRightToLeft ? 'rtl' : 'ltr';
```

### Usage Pattern

```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <button onClick={() => i18n.changeLanguage('kmr')}>
        {t('language.kurdish')}
      </button>
    </div>
  );
}
```

---

## 🗄️ State Management

### Provider Hierarchy

**Order matters!** This is the provider nesting in `web/src/App.tsx`:

```typescript
<ThemeProvider>              // Dark/light mode
  <ErrorBoundary>            // Error handling
    <AuthProvider>           // Supabase authentication
      <AppProvider>          // Global app state
        <PolkadotProvider>   // Blockchain API connection
          <WalletProvider>   // Wallet state & balances
            <WebSocketProvider> // Real-time blockchain events
              <IdentityProvider> // User identity & KYC
                <Router />
              </IdentityProvider>
            </WebSocketProvider>
          </WalletProvider>
        </PolkadotProvider>
      </AppProvider>
    </AuthProvider>
  </ErrorBoundary>
</ThemeProvider>
```

### Context APIs

**PolkadotContext:**
```typescript
interface PolkadotContextType {
  api: ApiPromise | null;
  isApiReady: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
}
```

**WalletContext:**
```typescript
interface WalletContextType {
  isConnected: boolean;
  account: string | null;
  accounts: InjectedAccountWithMeta[];
  balance: string;  // HEZ native balance
  balances: {
    HEZ: string;
    PEZ: string;
    wHEZ: string;
    USDT: string;
  };
  signer: Signer | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  switchAccount: (account: InjectedAccountWithMeta) => void;
  signTransaction: (tx: SubmittableExtrinsic) => Promise<string>;
  refreshBalances: () => Promise<void>;
}
```

### TanStack Query (React Query)

Used for server state caching and automatic refetching:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['proposals'],
  queryFn: () => fetchProposals(api),
  refetchInterval: 30000,  // Refresh every 30 seconds
  enabled: !!api,          // Only run when API is ready
});
```

---

## 🔐 Security Best Practices

### Environment Variables

**NEVER commit `.env` files!**

```bash
# .env.example (commit this)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_NETWORK=local

# .env (DO NOT commit)
VITE_SUPABASE_URL=https://actual-url.supabase.co
VITE_SUPABASE_ANON_KEY=actual_key_here
VITE_NETWORK=beta
```

**Access in code:**
```typescript
// Web (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Mobile (Expo)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

### Sensitive Data Handling

- **Wallet seeds:** NEVER stored in app - Polkadot.js extension only
- **Private keys:** NEVER accessible to frontend code
- **KYC data:** AES-GCM encrypted → IPFS → Hash stored on-chain
- **API keys:** Environment variables only, never hardcoded

### Error Handling

```typescript
// ErrorBoundary for React errors
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Try-catch for async operations
try {
  await api.tx.method(params).signAndSend(account, { signer });
  toast.success('Transaction successful!');
} catch (error) {
  console.error('Transaction failed:', error);
  toast.error(error.message || 'Transaction failed');
  // Don't expose sensitive error details to users
}
```

---

## 🧰 Utility Functions

### Formatting

```typescript
import { formatAddress, formatBalance, parseAmount } from '@pezkuwi/utils/formatting';

// Address formatting
formatAddress('5GrwVaEbzhSSC2biT...xQjz')
// → '5GrwV...xQjz'

// Balance formatting (with decimals)
formatBalance('1234567890000', 12)  // HEZ, PEZ, wHEZ
// → '1234.5679'

formatBalance('1234567', 6)  // wUSDT (6 decimals!)
// → '1.2346'

// Amount parsing (to BigInt)
parseAmount('100', 12)
// → 100000000000000n
```

### Validation

```typescript
import { isValidAddress, isValidAmount } from '@pezkuwi/utils/validation';

isValidAddress('5GrwVaEbzhSSC2biT...') // true
isValidAmount('100.5') // true
isValidAmount('abc') // false
```

---

## 🧪 Testing & Quality

### Before Committing

1. **Run linter:** `npm run lint`
2. **Check no `.env` committed:** `git status`
3. **Remove debug logs:** Search for `console.log`
4. **Update types:** If API changed
5. **Test i18n:** Check all 6 languages
6. **Test RTL:** Check ckb, ar, fa layouts

### Before Deploying

1. **Test production build:**
   ```bash
   npm run build
   npm run preview
   ```
2. **Verify environment variables** set correctly
3. **Check Supabase migrations** applied
4. **Backup database** (if schema changed)
5. **Monitor blockchain** validator status

---

## 📊 Database Schema (Supabase)

### Core Tables

- **profiles** - User profiles (linked to auth.users)
- **forum_categories** - Forum categories
- **forum_threads** - Forum threads
- **forum_posts** - Forum posts with moderation
- **courses** - Perwerde education courses
- **enrollments** - Course enrollments
- **p2p_offers** - P2P fiat trading offers
- **p2p_trades** - Active trades with escrow
- **p2p_reputation** - User reputation scores
- **payment_methods** - Payment method registry

### Hybrid Architecture

**Blockchain = Source of Truth**
```
User action → Blockchain transaction → Event emitted
     ↓
Event listener → Supabase sync (for indexing/caching)
     ↓
UI queries Supabase (fast) + Blockchain (verification)
```

**Example Flow (Creating a Course):**
1. User submits form
2. Frontend calls `api.tx.perwerde.createCourse(...)`
3. Transaction finalized on-chain
4. Event listener catches `CourseCreated` event
5. Sync to Supabase for UI display
6. UI reads from Supabase (fast) but trusts blockchain

---

## 🚨 Common Issues & Solutions

### Issue: Polkadot.js API not connecting

**Solution:**
1. Check endpoint is reachable: `curl -I http://37.60.230.9:9944`
2. Verify WebSocket protocol (wss vs ws)
3. Check CORS settings on blockchain node
4. Ensure validators are running: `ssh pezkuwi-vps "ps aux | grep pezkuwi"`

### Issue: Transaction fails with "BadOrigin"

**Solution:**
- User doesn't have required role (check pallet-tiki roles)
- Use `dispatch_as` if needed for elevated permissions

### Issue: Balance shows as 0

**Solution:**
- Check correct Asset ID (wHEZ: 0, PEZ: 1, wUSDT: 2)
- Remember wUSDT uses 6 decimals, not 12
- Verify account has opted-in to asset (required for assets pallet)

### Issue: i18n translations not loading

**Solution:**
- Web uses local `.ts` files (not shared JSON)
- Check import path: `import en from './locales/en.ts'`
- Not: `import en from '@pezkuwi/i18n/locales/en.json'`

### Issue: Build fails with "Can't resolve @pezkuwi/..."

**Solution:**
- Check Vite path aliases in `vite.config.ts`
- Verify TypeScript path mappings in `tsconfig.json`
- Run `npm install` in shared directory if using symlinks

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body (optional)>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Build process, dependencies

**Examples:**
```bash
git commit -m "feat: add P2P fiat trading interface"
git commit -m "fix: wUSDT decimals now correctly use 6 instead of 12"
git commit -m "docs: update CLAUDE.md with blockchain integration patterns"
```

---

## 🎓 Learning Resources

### Polkadot.js

- **API Docs:** https://polkadot.js.org/docs/
- **Apps UI:** https://github.com/polkadot-js/apps
- **Extension:** https://polkadot.js.org/extension/

### UI/UX

- **shadcn/ui:** https://ui.shadcn.com/
- **Radix UI:** https://www.radix-ui.com/
- **Tailwind CSS:** https://tailwindcss.com/

### Mobile

- **Expo:** https://docs.expo.dev/
- **React Native:** https://reactnative.dev/
- **React Navigation:** https://reactnavigation.org/

### Backend

- **Supabase:** https://supabase.com/docs
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## 🔧 Useful Commands

### Blockchain Health Check

```bash
# Check validator logs
ssh pezkuwi-vps "tail -f /tmp/validator-1.log"

# Check finalization
ssh pezkuwi-vps "tail -30 /tmp/validator-1.log | grep -E 'peers|finalized' | tail -5"

# View all validators
ssh pezkuwi-vps "ps aux | grep pezkuwi"
```

### Deployment

```bash
# Full web deployment
cd web && \
npm run build && \
rsync -avz dist/ pezkuwi-vps:/var/www/pezkuwichain/web/dist/ && \
ssh pezkuwi-vps "systemctl reload nginx"
```

### Database

```bash
# Apply Supabase migrations
cd web/supabase
supabase db push

# Reset local database
supabase db reset
```

---

## 🎯 AI Assistant Guidelines

### When Working on Features

1. **Read critical docs first:** `CLAUDE_README_KRITIK.md`
2. **Check current branch:** Verify you're on correct feature branch
3. **Test blockchain connectivity:** Before making blockchain changes
4. **Use existing patterns:** Follow component/context patterns
5. **Maintain type safety:** No `any` types
6. **Test all languages:** Check i18n keys exist
7. **Test RTL layout:** For ckb, ar, fa languages

### When Making Blockchain Changes

1. **Understand pallet first:** Read Rust pallet code if needed
2. **Test on local node:** Before testnet
3. **Handle errors properly:** Extract dispatchError correctly
4. **Update Supabase:** If creating indexable data
5. **Monitor events:** Use WebSocketContext for real-time updates

### When Deploying

1. **Never deploy without testing**
2. **Check validator status first:** Ensure blockchain is healthy
3. **Deploy during low-traffic hours:** If possible
4. **Monitor logs after deploy:** Watch for errors
5. **Have rollback plan:** Keep previous build

---

## 📞 Getting Help

### Documentation Files

- `README.md` - Project overview
- `CLAUDE_README_KRITIK.md` - Critical operational guidelines (Turkish)
- `PRODUCTION_READINESS.md` - Production status report
- `web/SECURITY.md` - Security policies
- `web/mimari.txt` - Detailed system architecture (Turkish)

### VPS Access

- **IP:** 37.60.230.9
- **SSH:** `ssh pezkuwi-vps` (alias assumed configured)
- **Web Root:** `/var/www/pezkuwichain/web/dist/`
- **Nginx Config:** `/etc/nginx/sites-available/pezkuwichain.io`

---

## ✅ Quick Reference Checklist

**Starting a new feature:**
- [ ] Create feature branch
- [ ] Read relevant shared libraries
- [ ] Check existing similar features
- [ ] Plan component structure
- [ ] Add i18n keys for all languages

**Before committing:**
- [ ] Run `npm run lint`
- [ ] Remove console.logs
- [ ] Check no `.env` changes
- [ ] Test in browser
- [ ] Write clear commit message

**Before deploying:**
- [ ] Test production build locally
- [ ] Verify environment variables
- [ ] Check blockchain connection
- [ ] Monitor validator status
- [ ] Plan rollback strategy

**After deploying:**
- [ ] Test live site
- [ ] Check browser console
- [ ] Monitor error logs
- [ ] Verify blockchain transactions work

---

**Last Updated:** 2025-11-17
**Maintained By:** PezkuwiChain Development Team
**Production Status:** 95% Complete - Beta Testnet Active
