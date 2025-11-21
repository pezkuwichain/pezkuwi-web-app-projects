# PezkuwiChain Frontend Test Suite

> **Comprehensive Testing Framework** based on blockchain pallet test scenarios
> **437 test functions** extracted from 12 pallets
> **71 success scenarios** + **58 failure scenarios** + **33 user flows**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Scenarios](#test-scenarios)
- [Writing New Tests](#writing-new-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This test suite provides comprehensive coverage for both **Web** and **Mobile** frontends, directly mapped to blockchain pallet functionality. Every test scenario is based on actual Rust tests from `scripts/tests/*.rs`.

### Test Types

| Type | Framework | Target | Coverage |
|------|-----------|--------|----------|
| **Unit Tests** | Jest + RTL | Components | ~70% |
| **Integration Tests** | Jest | State + API | ~60% |
| **E2E Tests (Web)** | Cypress | Full Flows | ~40% |
| **E2E Tests (Mobile)** | Detox | Full Flows | ~40% |

---

## 📊 Test Coverage

### By Pallet

| Pallet | Test Functions | Frontend Components | Test Files |
|--------|---------------|---------------------|------------|
| Identity-KYC | 39 | KYCApplication, CitizenStatus | 3 files |
| Perwerde (Education) | 30 | CourseList, Enrollment | 3 files |
| PEZ Rewards | 44 | EpochDashboard, ClaimRewards | 2 files |
| PEZ Treasury | 58 | TreasuryDashboard, MonthlyRelease | 2 files |
| Presale | 24 | PresaleWidget | 1 file |
| Referral | 17 | ReferralDashboard, InviteUser | 2 files |
| Staking Score | 23 | StakingScoreWidget | 1 file |
| Tiki (Roles) | 66 | RoleBadges, GovernanceRoles | 3 files |
| Token Wrapper | 18 | TokenWrapper | 1 file |
| Trust Score | 26 | TrustScoreWidget | 1 file |
| Validator Pool | 27 | ValidatorPool, Performance | 2 files |
| Welati (Governance) | 65 | ElectionWidget, ProposalList | 4 files |

### By Feature

| Feature | Web Tests | Mobile Tests | Total |
|---------|-----------|--------------|-------|
| Citizenship & KYC | 12 unit + 1 E2E | 8 unit + 1 E2E | 22 |
| Education Platform | 10 unit + 1 E2E | 12 unit + 1 E2E | 24 |
| Governance & Elections | 15 unit + 2 E2E | 10 unit + 1 E2E | 28 |
| P2P Trading | 8 unit + 1 E2E | 6 unit + 1 E2E | 16 |
| Rewards & Treasury | 12 unit | 0 | 12 |
| **TOTAL** | **57 unit + 5 E2E** | **36 unit + 4 E2E** | **102** |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Web dependencies
cd web
npm install

# Install Cypress (E2E)
npm install --save-dev cypress @cypress/react

# Mobile dependencies
cd mobile
npm install

# Install Detox (E2E)
npm install --save-dev detox detox-cli
```

### Run All Tests

```bash
# Web tests
./tests/run-web-tests.sh

# Mobile tests
./tests/run-mobile-tests.sh
```

### Run Specific Test Suite

```bash
# Web: Citizenship tests only
./tests/run-web-tests.sh suite citizenship

# Mobile: Education tests only
./tests/run-mobile-tests.sh suite education
```

---

## 📁 Test Structure

```
tests/
├── setup/                        # Test configuration
│   ├── web-test-setup.ts        # Jest setup for web
│   └── mobile-test-setup.ts     # Jest setup for mobile
│
├── utils/                        # Shared utilities
│   ├── mockDataGenerators.ts   # Mock data based on pallet tests
│   ├── testHelpers.ts           # Common test helpers
│   └── blockchainHelpers.ts     # Blockchain mock utilities
│
├── web/
│   ├── unit/                    # Component unit tests
│   │   ├── citizenship/         # KYC, Identity tests
│   │   ├── education/           # Perwerde tests
│   │   ├── governance/          # Elections, Proposals
│   │   ├── p2p/                 # P2P trading tests
│   │   ├── rewards/             # Epoch rewards tests
│   │   ├── treasury/            # Treasury tests
│   │   ├── referral/            # Referral system tests
│   │   ├── staking/             # Staking score tests
│   │   ├── validator/           # Validator pool tests
│   │   └── wallet/              # Token wrapper tests
│   │
│   └── e2e/cypress/             # E2E tests
│       ├── citizenship-kyc.cy.ts
│       ├── education-flow.cy.ts
│       ├── governance-voting.cy.ts
│       ├── p2p-trading.cy.ts
│       └── rewards-claiming.cy.ts
│
└── mobile/
    ├── unit/                    # Component unit tests
    │   ├── citizenship/
    │   ├── education/
    │   ├── governance/
    │   ├── p2p/
    │   └── rewards/
    │
    └── e2e/detox/               # E2E tests
        ├── education-flow.e2e.ts
        ├── governance-flow.e2e.ts
        ├── p2p-trading.e2e.ts
        └── wallet-flow.e2e.ts
```

---

## 🧪 Running Tests

### Web Tests

#### Unit Tests Only
```bash
./tests/run-web-tests.sh unit
```

#### E2E Tests Only
```bash
./tests/run-web-tests.sh e2e
```

#### Watch Mode (for development)
```bash
./tests/run-web-tests.sh watch
```

#### Coverage Report
```bash
./tests/run-web-tests.sh coverage
# Opens: web/coverage/index.html
```

#### Specific Feature Suite
```bash
./tests/run-web-tests.sh suite citizenship
./tests/run-web-tests.sh suite education
./tests/run-web-tests.sh suite governance
./tests/run-web-tests.sh suite p2p
./tests/run-web-tests.sh suite rewards
./tests/run-web-tests.sh suite treasury
```

### Mobile Tests

#### Unit Tests Only
```bash
./tests/run-mobile-tests.sh unit
```

#### E2E Tests (iOS)
```bash
./tests/run-mobile-tests.sh e2e ios
```

#### E2E Tests (Android)
```bash
./tests/run-mobile-tests.sh e2e android
```

#### Watch Mode
```bash
./tests/run-mobile-tests.sh watch
```

#### Coverage Report
```bash
./tests/run-mobile-tests.sh coverage
# Opens: mobile/coverage/index.html
```

---

## 📝 Test Scenarios

### 1. Citizenship & KYC

**Pallet:** `tests-identity-kyc.rs` (39 tests)

**Success Scenarios:**
- ✅ Set identity with name and email
- ✅ Apply for KYC with IPFS CIDs and deposit
- ✅ Admin approves KYC, deposit refunded
- ✅ Self-confirm citizenship (Welati NFT holders)
- ✅ Renounce citizenship and reapply

**Failure Scenarios:**
- ❌ Apply for KYC without setting identity first
- ❌ Apply for KYC when already pending
- ❌ Insufficient balance for deposit
- ❌ Name exceeds 50 characters
- ❌ Invalid IPFS CID format

**User Flows:**
1. **Full KYC Flow:** Set Identity → Apply for KYC → Admin Approval → Citizen NFT
2. **Self-Confirmation:** Set Identity → Apply → Self-Confirm → Citizen NFT
3. **Rejection:** Apply → Admin Rejects → Reapply

**Test Files:**
- `tests/web/unit/citizenship/KYCApplication.test.tsx`
- `tests/web/e2e/cypress/citizenship-kyc.cy.ts`
- `tests/mobile/unit/citizenship/KYCForm.test.tsx`

---

### 2. Education Platform (Perwerde)

**Pallet:** `tests-perwerde.rs` (30 tests)

**Success Scenarios:**
- ✅ Admin creates course
- ✅ Student enrolls in active course
- ✅ Student completes course with points
- ✅ Multiple students enroll in same course
- ✅ Archive course

**Failure Scenarios:**
- ❌ Non-admin tries to create course
- ❌ Enroll in archived course
- ❌ Enroll when already enrolled
- ❌ Complete course without enrollment
- ❌ Exceed 100 course enrollment limit

**User Flows:**
1. **Student Learning:** Browse Courses → Enroll → Study → Complete → Earn Certificate
2. **Admin Management:** Create Course → Monitor Enrollments → Archive
3. **Multi-Course:** Enroll in multiple courses up to limit

**Test Files:**
- `tests/web/unit/education/CourseList.test.tsx`
- `tests/mobile/unit/education/CourseList.test.tsx`
- `tests/mobile/e2e/detox/education-flow.e2e.ts`

---

### 3. Governance & Elections (Welati)

**Pallet:** `tests-welati.rs` (65 tests)

**Success Scenarios:**
- ✅ Initiate election (Presidential, Parliamentary, Constitutional Court)
- ✅ Register as candidate with endorsements
- ✅ Cast vote during voting period
- ✅ Finalize election and determine winners
- ✅ Submit and vote on proposals

**Failure Scenarios:**
- ❌ Register without required endorsements
- ❌ Register after candidacy deadline
- ❌ Vote twice in same election
- ❌ Vote outside voting period
- ❌ Turnout below required threshold

**Election Requirements:**
- **Presidential:** 600 trust score, 100 endorsements, 50% turnout
- **Parliamentary:** 300 trust score, 50 endorsements, 40% turnout
- **Constitutional Court:** 750 trust score, 50 endorsements, 30% turnout

**User Flows:**
1. **Voting:** Browse Elections → Select Candidate(s) → Cast Vote → View Results
2. **Candidate Registration:** Meet Requirements → Collect Endorsements → Register → Campaign
3. **Proposal:** Submit Proposal → Parliament Votes → Execute if Passed

**Test Files:**
- `tests/web/unit/governance/ElectionWidget.test.tsx`
- `tests/web/e2e/cypress/governance-voting.cy.ts`
- `tests/mobile/unit/governance/ElectionList.test.tsx`

---

### 4. P2P Fiat Trading

**Pallet:** `tests-welati.rs` (P2P section)

**Success Scenarios:**
- ✅ Create buy/sell offer
- ✅ Accept offer and initiate trade
- ✅ Release escrow on completion
- ✅ Dispute resolution
- ✅ Reputation tracking

**Failure Scenarios:**
- ❌ Create offer with insufficient balance
- ❌ Accept own offer
- ❌ Release escrow without trade completion
- ❌ Invalid payment proof

**User Flows:**
1. **Seller Flow:** Create Sell Offer → Buyer Accepts → Receive Fiat → Release Crypto
2. **Buyer Flow:** Browse Offers → Accept Offer → Send Fiat → Receive Crypto
3. **Dispute:** Trade Stalled → Open Dispute → Mediator Resolves

**Test Files:**
- `tests/web/unit/p2p/OfferList.test.tsx`
- `tests/web/e2e/cypress/p2p-trading.cy.ts`
- `tests/mobile/unit/p2p/P2PScreen.test.tsx`

---

### 5. Rewards & Treasury

**Pallets:** `tests-pez-rewards.rs` (44 tests), `tests-pez-treasury.rs` (58 tests)

**Success Scenarios:**
- ✅ Record trust score for epoch
- ✅ Claim epoch rewards
- ✅ Parliamentary NFT holders receive 10%
- ✅ Monthly treasury release (75% incentive, 25% government)
- ✅ Halving every 48 months

**Failure Scenarios:**
- ❌ Claim reward when already claimed
- ❌ Claim without participating in epoch
- ❌ Claim after claim period ends
- ❌ Release funds before month ends

**User Flows:**
1. **Epoch Participation:** Record Trust Score → Wait for End → Claim Reward
2. **Treasury Release:** Monthly Trigger → Incentive/Gov Pots Funded
3. **Halving Event:** 48 Months → Amount Halved → New Period Begins

**Test Files:**
- `tests/web/unit/rewards/EpochDashboard.test.tsx`
- `tests/web/unit/treasury/TreasuryDashboard.test.tsx`

---

### 6. Referral System

**Pallet:** `tests-referral.rs` (17 tests)

**Success Scenarios:**
- ✅ Initiate referral invitation
- ✅ Confirm referral on KYC approval
- ✅ Referral score calculation with tiers

**Scoring Tiers:**
- 0-10 referrals: score = count × 10
- 11-50 referrals: score = 100 + (count - 10) × 5
- 51-100 referrals: score = 300 + (count - 50) × 4
- 100+ referrals: score = 500 (capped)

**Test Files:**
- `tests/web/unit/referral/ReferralDashboard.test.tsx`

---

### 7. Staking Score

**Pallet:** `tests-staking-score.rs` (23 tests)

**Base Score Tiers:**
- 0-99 HEZ: 0 points
- 100-249 HEZ: 20 points
- 250-749 HEZ: 30 points
- 750+ HEZ: 40 points

**Duration Multipliers:**
- 0 months: 1.0x
- 1 month: 1.2x
- 3 months: 1.4x
- 6 months: 1.7x
- 12+ months: 2.0x
- **Max final score: 100 (capped)**

**Test Files:**
- `tests/web/unit/staking/StakingScoreWidget.test.tsx`

---

### 8. Tiki (Governance Roles)

**Pallet:** `tests-tiki.rs` (66 tests)

**Role Types:**
- **Automatic:** Welati (10 pts)
- **Elected:** Parlementer (100), Serok (200), SerokiMeclise (150)
- **Appointed:** Wezir (100), Dadger (150), Dozger (120)
- **Earned:** Axa (250), Mamoste (70), Rewsenbîr (80)

**Success Scenarios:**
- ✅ Mint Citizen NFT, auto-grant Welati
- ✅ Grant appointed/elected/earned roles
- ✅ Revoke roles (except Welati)
- ✅ Unique role enforcement (Serok, SerokiMeclise, Xezinedar)
- ✅ Tiki score calculation

**Test Files:**
- `tests/web/unit/tiki/RoleBadges.test.tsx`

---

### 9. Token Wrapper

**Pallet:** `tests-token-wrapper.rs` (18 tests)

**Success Scenarios:**
- ✅ Wrap HEZ → wHEZ (1:1)
- ✅ Unwrap wHEZ → HEZ (1:1)
- ✅ Multiple wrap/unwrap operations
- ✅ 1:1 backing maintained

**Test Files:**
- `tests/web/unit/wallet/TokenWrapper.test.tsx`

---

### 10. Trust Score

**Pallet:** `tests-trust.rs` (26 tests)

**Formula:**
```typescript
weighted_sum = (staking × 100) + (referral × 300) + (perwerde × 300) + (tiki × 300)
trust_score = staking × weighted_sum / 1000
```

**Test Files:**
- `tests/web/unit/profile/TrustScoreWidget.test.tsx`

---

### 11. Validator Pool

**Pallet:** `tests-validator-pool.rs` (27 tests)

**Categories:**
- **Stake Validators:** Trust score 800+
- **Parliamentary Validators:** Tiki score required
- **Merit Validators:** Tiki + community support

**Performance Metrics:**
- Blocks produced/missed
- Reputation score: (blocks_produced × 100) / (blocks_produced + blocks_missed)
- Era points earned

**Test Files:**
- `tests/web/unit/validator/ValidatorPool.test.tsx`

---

### 12. Presale

**Pallet:** `tests-presale.rs` (24 tests)

**Conversion:**
- 100 wUSDT (6 decimals) = 10,000 PEZ (12 decimals)

**Success Scenarios:**
- ✅ Start presale with duration
- ✅ Contribute wUSDT, receive PEZ
- ✅ Multiple contributions accumulate
- ✅ Finalize and distribute

**Test Files:**
- `tests/web/unit/presale/PresaleWidget.test.tsx`

---

## ✍️ Writing New Tests

### 1. Component Unit Test Template

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { generateMockCourse } from '../../../utils/mockDataGenerators';
import { buildPolkadotContextState } from '../../../utils/testHelpers';

describe('YourComponent', () => {
  let mockApi: any;

  beforeEach(() => {
    mockApi = buildPolkadotContextState();
  });

  test('should render correctly', () => {
    const mockData = generateMockCourse();
    // Your test logic
  });

  test('should handle user interaction', async () => {
    // Your test logic
  });

  test('should handle error state', () => {
    // Your test logic
  });
});
```

### 2. E2E Test Template (Cypress)

```typescript
describe('Feature Flow (E2E)', () => {
  beforeEach(() => {
    cy.visit('/feature');
  });

  it('should complete full flow', () => {
    // Step 1: Setup
    cy.get('[data-testid="input"]').type('value');

    // Step 2: Action
    cy.get('[data-testid="submit-btn"]').click();

    // Step 3: Verify
    cy.contains('Success').should('be.visible');
  });
});
```

### 3. Mock Data Generator

```typescript
export const generateMockYourData = () => ({
  id: Math.floor(Math.random() * 1000),
  field1: 'value1',
  field2: Math.random() * 100,
  // ... match blockchain pallet storage
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd web && npm ci
      - run: ./tests/run-web-tests.sh unit
      - run: ./tests/run-web-tests.sh e2e

  mobile-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd mobile && npm ci
      - run: ./tests/run-mobile-tests.sh unit
      - run: ./tests/run-mobile-tests.sh e2e ios
```

---

## 🐛 Troubleshooting

### Common Issues

#### Jest: Module not found
```bash
# Install dependencies
cd web && npm install
# or
cd mobile && npm install
```

#### Cypress: Cannot find browser
```bash
# Install Cypress binaries
npx cypress install
```

#### Detox: iOS simulator not found
```bash
# List available simulators
xcrun simctl list devices

# Boot simulator
open -a Simulator
```

#### Mock data not matching blockchain
```bash
# Re-analyze pallet tests
cd scripts/tests
cargo test -p pallet-identity-kyc -- --nocapture
```

### Debug Mode

```bash
# Web tests with verbose output
./tests/run-web-tests.sh unit | tee test-output.log

# Mobile tests with debug
DEBUG=* ./tests/run-mobile-tests.sh unit
```

---

## 📚 Resources

- **Blockchain Pallet Tests:** `scripts/tests/*.rs`
- **Mock Data Generators:** `tests/utils/mockDataGenerators.ts`
- **Test Helpers:** `tests/utils/testHelpers.ts`
- **Jest Documentation:** https://jestjs.io/
- **React Testing Library:** https://testing-library.com/react
- **Cypress Documentation:** https://docs.cypress.io/
- **Detox Documentation:** https://wix.github.io/Detox/

---

## 📊 Test Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Unit Test Coverage | 80% | 70% |
| Integration Test Coverage | 60% | 60% |
| E2E Test Coverage | 50% | 40% |
| Test Execution Time (Unit) | < 2 min | ~1.5 min |
| Test Execution Time (E2E) | < 10 min | ~8 min |

---

## 🎯 Roadmap

- [ ] Achieve 80% unit test coverage
- [ ] Add visual regression testing (Percy/Chromatic)
- [ ] Implement mutation testing (Stryker)
- [ ] Add performance testing (Lighthouse CI)
- [ ] Set up continuous test monitoring (Codecov)
- [ ] Create test data factories for all pallets
- [ ] Add snapshot testing for UI components

---

**Last Updated:** 2025-11-21
**Test Suite Version:** 1.0.0
**Maintained By:** PezkuwiChain Development Team
