# Shared Code

This directory contains code shared between web and mobile applications.

## Structure

- **types/** - TypeScript type definitions and interfaces
- **utils/** - Utility functions and helpers
- **blockchain/** - Blockchain-related utilities (Polkadot API wrappers, transaction helpers)
- **constants/** - Shared constants and configuration values

## Usage

Import shared code in your projects:

```typescript
// Web project
import { SomeType } from '../shared/types';
import { someUtil } from '../shared/utils';

// Mobile project
import { SomeType } from '../shared/types';
```

## Guidelines

- Keep code framework-agnostic when possible
- Add comprehensive JSDoc comments
- Write unit tests for utilities
- Avoid platform-specific dependencies
