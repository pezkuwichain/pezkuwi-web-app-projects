# PEZ Token Pre-Sale Guide

## Overview

The PEZ Token Pre-Sale allows users to contribute wUSDT (wrapped USDT on PezkuwiChain) and receive PEZ tokens at a special conversion rate of **1 wUSDT = 20 PEZ**.

### Key Details

- **Duration**: 45 days from start
- **Conversion Rate**: 1 wUSDT = 20 PEZ
- **Accepted Token**: wUSDT (Asset ID: 2)
- **Reward Token**: PEZ (Asset ID: 1)
- **Distribution**: Automatic after 45 days
- **Lock Period**: None
- **Max Contributors**: 10,000

## For Users: How to Participate

### Prerequisites

1. **PezkuwiChain Wallet**: Install and create a wallet
2. **wUSDT Balance**: Bridge USDT to wUSDT on PezkuwiChain
3. **Network**: Connect to PezkuwiChain mainnet

### Step-by-Step Guide

#### 1. Get wUSDT

If you don't have wUSDT:
```
1. Go to Bridge page
2. Select "USDT → wUSDT"
3. Choose source network (Tron, BSC, Ethereum, etc.)
4. Enter amount and bridge
5. Wait for confirmation
```

#### 2. Visit Pre-Sale Page

Navigate to: `https://pezkuwichain.io/presale`

#### 3. Connect Wallet

Click "Connect Wallet" and select your PezkuwiChain account.

#### 4. Check Your Balance

Verify you have sufficient wUSDT in the balance display.

#### 5. Enter Contribution Amount

```
Example:
- Enter: 100 wUSDT
- You'll receive: 2,000 PEZ
```

#### 6. Submit Contribution

Click "Contribute wUSDT" and sign the transaction.

#### 7. Wait for Distribution

After 45 days, PEZ will be automatically distributed to your wallet.

### FAQs

**Q: What is the minimum contribution?**
A: Technically 0.000001 wUSDT, but recommended minimum is 1 wUSDT.

**Q: Can I contribute multiple times?**
A: Yes, contributions accumulate.

**Q: When do I receive PEZ?**
A: Automatically after the 45-day presale period ends and admin finalizes.

**Q: Can I withdraw my contribution?**
A: No, contributions are final and non-refundable.

**Q: What if presale is paused?**
A: Contributions are disabled during pause. Wait for unpause.

**Q: How are decimals handled?**
A: wUSDT has 6 decimals, PEZ has 12 decimals. Conversion is automatic.

## For Admins: Management Guide

### Starting the Pre-Sale

**Requirements**: Sudo/root access

**Steps**:
```bash
# Via Polkadot.js Apps
1. Go to Developer → Extrinsics
2. Select: presale → startPresale()
3. Submit with sudo account
4. Wait for confirmation
```

**Via CLI**:
```bash
polkadot-js-api tx.sudo.sudo \
  tx.presale.startPresale() \
  --seed "YOUR_SUDO_SEED"
```

**What Happens**:
- PresaleActive = true
- Start block recorded
- 45-day countdown begins
- Frontend shows active presale

### Monitoring the Pre-Sale

**Check Status**:
```javascript
// Via JavaScript
const active = await api.query.presale.presaleActive();
const totalRaised = await api.query.presale.totalRaised();
const contributors = await api.query.presale.contributors();
const startBlock = await api.query.presale.presaleStartBlock();

console.log('Active:', active.toHuman());
console.log('Raised:', totalRaised.toString() / 1_000_000, 'USDT');
console.log('Contributors:', contributors.toHuman().length);
```

**Via Polkadot.js Apps**:
```
1. Developer → Chain State
2. Select: presale
3. Query: presaleActive, totalRaised, contributors
```

### Emergency Pause

**When to Use**: Security issue, bug detected, suspicious activity

**Steps**:
```bash
# Pause
polkadot-js-api tx.sudo.sudo \
  tx.presale.emergencyPause() \
  --seed "YOUR_SUDO_SEED"

# Resume
polkadot-js-api tx.sudo.sudo \
  tx.presale.emergencyUnpause() \
  --seed "YOUR_SUDO_SEED"
```

**Effect**:
- Contributions disabled
- Yellow warning banner on frontend
- Users can still view stats

### Finalizing the Pre-Sale

**Requirements**:
- Presale active
- 45 days elapsed
- Sudo access
- Treasury has sufficient PEZ

**Pre-Flight Checks**:
```javascript
// 1. Check time remaining
const timeRemaining = await api.query.presale.getTimeRemaining();
console.log('Blocks remaining:', timeRemaining.toNumber());

// 2. Verify treasury PEZ balance
const treasury = api.query.presale.accountId();
const pezBalance = await api.query.assets.account(1, treasury);
console.log('Treasury PEZ:', pezBalance.toHuman());

// 3. Calculate required PEZ
const totalRaised = await api.query.presale.totalRaised();
const requiredPez = (totalRaised * 20 * 1e12) / 1e6;
console.log('Required PEZ:', requiredPez);
```

**Finalization Steps**:
```bash
1. Wait until timeRemaining = 0 blocks
2. Verify treasury has enough PEZ
3. Submit finalizePresale() extrinsic
4. Monitor distribution events
```

**Via CLI**:
```bash
polkadot-js-api tx.sudo.sudo \
  tx.presale.finalizePresale() \
  --seed "YOUR_SUDO_SEED"
```

**What Happens**:
- Loops through all contributors
- Calculates PEZ for each (contribution × 20)
- Transfers PEZ from treasury
- Emits Distributed events
- Sets PresaleActive = false
- Emits PresaleFinalized event

**Gas Warning**: With many contributors (1000+), this may be a heavy transaction. Consider:
- Batching distributions if needed
- Monitoring block execution time

## Technical Details

### Pallet Configuration

```rust
// Runtime configuration
parameter_types! {
    pub const WUsdtAssetId: u32 = 2;           // wUSDT
    pub const PezAssetId: u32 = 1;             // PEZ
    pub const ConversionRate: u128 = 20;       // 1:20 ratio
    pub const PresaleDuration: BlockNumber = 648_000; // 45 days @ 6s
    pub const MaxContributors: u32 = 10_000;   // Hard limit
}
```

### Decimal Conversion Math

```rust
// Input: 100 wUSDT = 100_000_000 (6 decimals)
// Calculation:
// 1. wUSDT to USD: 100_000_000 / 1_000_000 = 100 USD
// 2. Apply rate: 100 * 20 = 2000 PEZ units
// 3. Add decimals: 2000 * 1_000_000_000_000 = 2_000_000_000_000_000 (12 decimals)
// Output: 2000 PEZ
```

### Storage Items

| Item | Type | Description |
|------|------|-------------|
| `Contributions` | Map<AccountId, u128> | wUSDT amounts per user |
| `Contributors` | BoundedVec<AccountId> | List of all contributors |
| `PresaleActive` | bool | Is presale running |
| `PresaleStartBlock` | BlockNumber | When presale started |
| `TotalRaised` | u128 | Sum of all contributions |
| `Paused` | bool | Emergency pause flag |

### Events

```rust
PresaleStarted { end_block: BlockNumber }
Contributed { who: AccountId, amount: u128 }
PresaleFinalized { total_raised: u128 }
Distributed { who: AccountId, pez_amount: u128 }
EmergencyPaused
EmergencyUnpaused
```

### Extrinsics

| Function | Weight | Caller | Description |
|----------|--------|--------|-------------|
| `start_presale()` | 10M | Sudo | Start 45-day presale |
| `contribute(amount)` | 50M | Anyone | Contribute wUSDT |
| `finalize_presale()` | 30M + 20M×n | Sudo | Distribute PEZ |
| `emergency_pause()` | 6M | Sudo | Pause contributions |
| `emergency_unpause()` | 6M | Sudo | Resume contributions |

## Security Considerations

### Access Control
- ✅ Only sudo can start/finalize/pause
- ✅ Users can only contribute (not withdraw)
- ✅ Treasury account is pallet-controlled

### Safeguards
- ✅ Cannot contribute zero amount
- ✅ Cannot contribute if not active/paused/ended
- ✅ Cannot finalize before 45 days
- ✅ Cannot start if already started
- ✅ BoundedVec prevents DoS (max 10k contributors)

### Audit Recommendations
- [ ] Third-party security audit before mainnet
- [ ] Fuzz testing for arithmetic edge cases
- [ ] Load testing with max contributors
- [ ] Disaster recovery plan

## Troubleshooting

### "Presale Not Active" Error
- Verify presale has been started by sudo
- Check `presaleActive` storage

### "Presale Ended" Error
- Check time remaining
- Presale may have already ended

### "Transfer Failed" Error
- Verify user has sufficient wUSDT
- Check wUSDT asset exists and is transferable
- Ensure allowance/approval if needed

### "Insufficient PEZ Balance" (Finalization)
- Treasury must be pre-funded with PEZ
- Calculate required: `totalRaised * 20 * 1e12 / 1e6`

### Frontend Not Loading Data
- Check API connection
- Verify presale pallet in runtime
- Check browser console for errors
- Ensure correct network selected

## Monitoring & Analytics

### Key Metrics to Track

```javascript
// Real-time monitoring script
setInterval(async () => {
  const active = await api.query.presale.presaleActive();
  const raised = await api.query.presale.totalRaised();
  const contributors = await api.query.presale.contributors();
  const paused = await api.query.presale.paused();

  console.log({
    active: active.toHuman(),
    raisedUSDT: raised.toString() / 1_000_000,
    contributors: contributors.toHuman().length,
    paused: paused.toHuman()
  });
}, 60000); // Every minute
```

### Event Monitoring

```javascript
// Subscribe to presale events
api.query.system.events((events) => {
  events.forEach(({ event }) => {
    if (api.events.presale.Contributed.is(event)) {
      const [who, amount] = event.data;
      console.log(`New contribution: ${who} → ${amount} wUSDT`);
    }
  });
});
```

## Appendix

### Useful Links
- Polkadot.js Apps: https://polkadot.js.org/apps
- PezkuwiChain Explorer: https://explorer.pezkuwichain.io
- Bridge: https://bridge.pezkuwichain.io
- Pre-Sale UI: https://pezkuwichain.io/presale

### Contact
- Technical Support: tech@pezkuwichain.io
- Security Issues: security@pezkuwichain.io
- General Inquiries: info@pezkuwichain.io

---

**Document Version**: 1.0
**Last Updated**: 2025-01-20
**Author**: PezkuwiChain Team
