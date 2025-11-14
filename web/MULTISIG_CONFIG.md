# USDT Treasury Multisig Configuration

## 🔐 Multisig Members (3/5 Threshold)

### 1️⃣ Serok (Founder) - UNIQUE ✅
```
Address:    5D74yW53pg3gCaLMzGvZUNxiqTZMwFXA85bB2QYfcYh5Tdc4
Public Key: 0x2e09d02b815849b92dd5a5aa0d5591e1b1c82311a9385975ebb0ff2cc34e6727
Source:     On-chain (pallet-tiki)
```

### 2️⃣ SerokiMeclise (Parliament Speaker) - UNIQUE ✅
```
Address:    5GTRuK96TkmjUSuQnkjBJBCEmHSDSdW22ptWosxCBWACfsZp
Public Key: 0xc245deedbf626ba3400df709befe52d938eca44e863ea5bd59b0a81f3c41f632
Source:     On-chain (pallet-tiki)
```

### 3️⃣ Xezinedar (Treasurer) - UNIQUE ✅
```
Address:    5DRTYPChot1UPDHEeJVTtuE8dLDgCVvAcWbdnc8zwwpYYjeR
Public Key: 0x3c10328e0bcfbb03969f72ed0630f091e4603f2a865c8184d33f4bfa3385db02
Source:     On-chain (pallet-tiki)
```

### 4️⃣ Noter (Notary) - Specified
```
Address:    5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3
Public Key: 0x34cefb7e586c150b771813a210d6d5a2a60c8d8bc2b2fecf58fd0af11341167f
Source:     Hardcoded (non-unique role)
```

### 5️⃣ Berdevk (Spokesperson) - Specified
```
Address:    5F4V6dzpe72dE2C7YN3y7VGznMTWPFeSKL3ANhp4XasXjfvj
Public Key: 0x8489bfd011f05bff909dff31d7fee6182ce058673cbf98b03a8c904f89e8f43e
Source:     Hardcoded (non-unique role)
```

---

## 🎯 Multisig Address Calculation

### Sorted Member Addresses (Required for multisig):
```
1. 5D74yW53pg3gCaLMzGvZUNxiqTZMwFXA85bB2QYfcYh5Tdc4 (Serok)
2. 5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3 (Noter)
3. 5DRTYPChot1UPDHEeJVTtuE8dLDgCVvAcWbdnc8zwwpYYjeR (Xezinedar)
4. 5F4V6dzpe72dE2C7YN3y7VGznMTWPFeSKL3ANhp4XasXjfvj (Berdevk)
5. 5GTRuK96TkmjUSuQnkjBJBCEmHSDSdW22ptWosxCBWACfsZp (SerokiMeclise)
```

### Threshold: 3/5

### Multisig Address:
```
To be calculated using: calculateMultisigAddress(sortedMembers, 3)
Formula: Substrate multisig address derivation
```

**Note:** Multisig address will be deterministically derived from sorted member addresses and threshold.

---

## 📋 Quick Reference

### Frontend Config Location:
```
src/pages/ReservesDashboardPage.tsx
```

### How to Update:
```typescript
const SPECIFIC_ADDRESSES = {
  Noter: '5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3',
  Berdevk: '5F4V6dzpe72dE2C7YN3y7VGznMTWPFeSKL3ANhp4XasXjfvj',
};
```

### Verification:
1. Check on-chain tiki holders for unique roles:
   ```
   api.query.tiki.tikiHolder(Tiki.Serok)
   api.query.tiki.tikiHolder(Tiki.SerokiMeclise)
   api.query.tiki.tikiHolder(Tiki.Xezinedar)
   ```

2. Verify multisig members match:
   ```javascript
   import { getMultisigMembers } from '@/lib/multisig';
   const members = await getMultisigMembers(api, SPECIFIC_ADDRESSES);
   console.log(members);
   ```

---

## 🔒 Security Reminders

### ✅ PUBLIC (Safe to share):
- Account addresses (5xxx...)
- Public keys (0xxx...)
- Multisig configuration

### 🔴 NEVER SHARE:
- Seed phrases (12/24 words)
- Private keys
- Mnemonic words
- JSON keystore passwords

---

## 🚀 Next Steps

1. **On-chain Setup:**
   ```bash
   # Create wUSDT asset with multisig as admin
   assets.create(2, <multisig_address>, 1000000)
   assets.setMetadata(2, "Wrapped USDT", "wUSDT", 6)
   ```

2. **Verify Multisig:**
   ```
   Visit: http://localhost:8080/reserves
   Check: Multisig Members tab
   ```

3. **Test Transaction:**
   ```bash
   # Create a test multisig tx
   # First member initiates
   # 2 more members approve
   # Execute when 3/5 reached
   ```

---

**Last Updated:** 2025-11-03
**Status:** ✅ Configured and Ready
