# Shared Code

This directory contains code shared between web, mobile, and SDK UI applications.

## Structure

- **types/** - TypeScript type definitions and interfaces
  - `blockchain.ts` - Blockchain-related types (WalletAccount, Transaction, etc.)
  - `tokens.ts` - Token and DEX types (TokenInfo, PoolInfo, SwapQuote, etc.)

- **constants/** - Shared constants and configuration values
  - `KNOWN_TOKENS` - Token definitions (HEZ, PEZ, USDT)
  - `KURDISTAN_COLORS` - Color palette (Kesk, Sor, Zer, Spî, Reş)
  - `SUPPORTED_LANGUAGES` - Available languages (EN, TR, KMR, CKB, AR, FA)
  - `TOKEN_DISPLAY_SYMBOLS` - Display vs blockchain symbol mapping

- **blockchain/** - Blockchain-related utilities
  - `polkadot.ts` - Polkadot/Substrate utilities and endpoints
  - `DEFAULT_ENDPOINT` - Current blockchain endpoint (beta testnet)

- **i18n/** - Internationalization
  - `locales/` - Translation files for 6 languages
  - `LANGUAGES` - Language configurations with RTL support
  - `translations` - All locale data

- **utils/** - Utility functions and helpers
  - `formatting.ts` - Address and number formatting
  - `validation.ts` - Input validation utilities

## Usage

Import shared code in your projects:

```typescript
// Token types and constants
import { TokenInfo, KNOWN_TOKENS } from '../../../shared/types/tokens';
import { KURDISTAN_COLORS, TOKEN_DISPLAY_SYMBOLS } from '../../../shared/constants';

// Blockchain utilities
import { DEFAULT_ENDPOINT, BLOCKCHAIN_ENDPOINTS } from '../../../shared/blockchain/polkadot';

// i18n
import { translations, LANGUAGES, isRTL } from '../../../shared/i18n';

// Formatting utilities
import { formatAddress, formatTokenAmount } from '../../../shared/utils/formatting';
```

## Guidelines

- Keep code framework-agnostic when possible
- Add comprehensive JSDoc comments
- Write unit tests for utilities
- Avoid platform-specific dependencies
- Use relative imports: `../../../shared/...` from web/mobile/SDK UI
