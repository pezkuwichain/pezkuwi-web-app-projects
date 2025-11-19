# 🏛️ KYC Council Backend

Backend simulation of pallet-collective voting for KYC approvals.

## 📋 Overview

**Purpose:** Decentralized KYC approval system without runtime changes

**Architecture:**
- Backend tracks council votes (in-memory)
- 60% threshold (e.g., 7/11 votes)
- Auto-executes approve_kyc when threshold reached
- Uses SUDO account to sign blockchain transactions

## 🔗 Chain Flow

```
User applies → Blockchain (PENDING) → Council votes → Backend auto-approves → Welati NFT minted
```

**Why SUDO account?**
- `identityKyc.approveKyc()` requires `EnsureRoot` origin
- Backend signs transactions on behalf of council
- Alternative: Change runtime to accept council origin (not needed for MVP)

---

## 🚀 Installation

### 1. Install Dependencies

```bash
cd /home/mamostehp/pwap/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required variables:**
```env
WS_ENDPOINT=wss://ws.pezkuwichain.io
SUDO_SEED=your_sudo_seed_phrase_here
PORT=3001
```

⚠️ **Security Warning:** Keep SUDO_SEED secret! Use a dedicated account for KYC approvals only.

### 3. Start Server

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## 📡 API Endpoints

### Council Management

#### Add Council Member
```bash
POST /api/council/add-member
{
  "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "signature": "0x..." // TODO: Implement signature verification
}
```

#### Remove Council Member
```bash
POST /api/council/remove-member
{
  "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
}
```

#### Get Council Members
```bash
GET /api/council/members
```

Response:
```json
{
  "members": ["5DFw...Dwd3", "5Grw...utQY"],
  "totalMembers": 2,
  "threshold": 0.6,
  "votesRequired": 2
}
```

#### Sync with Noter Tiki Holders
```bash
POST /api/council/sync-notaries
```

Auto-fetches first 10 Noter tiki holders from blockchain and updates council.

---

### KYC Voting

#### Propose KYC Approval
```bash
POST /api/kyc/propose
{
  "userAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "proposerAddress": "5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3",
  "signature": "0x..."
}
```

**Logic:**
- Proposer auto-votes AYE
- If threshold already met (e.g., 1/1 member), auto-executes immediately

#### Vote on Proposal
```bash
POST /api/kyc/vote
{
  "userAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "voterAddress": "5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3",
  "approve": true,
  "signature": "0x..."
}
```

**Approve:** true = AYE, false = NAY

**Auto-execute:** If votes reach threshold, backend signs and submits `approve_kyc` transaction.

#### Get Pending Proposals
```bash
GET /api/kyc/pending
```

Response:
```json
{
  "pending": [
    {
      "userAddress": "5Grw...utQY",
      "proposer": "5DFw...Dwd3",
      "ayes": ["5DFw...Dwd3", "5HpG...vSKr"],
      "nays": [],
      "timestamp": 1700000000000,
      "votesCount": 2,
      "threshold": 7,
      "status": "VOTING"
    }
  ]
}
```

---

## 🔐 Council Membership Rules

### Initial Setup
- **1 member:** Founder delegate (hardcoded: `5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3`)
- **Threshold:** 1/1 = 100% (single vote approves)

### Growth Path
1. **Add Noter holders:** Use `/api/council/sync-notaries` to fetch first 10 Noter tiki holders
2. **Council size:** 11 members (1 founder + 10 notaries)
3. **Threshold:** 7/11 = 63.6% (60% threshold met)

### Automatic Updates
- When Noter loses tiki → Remove from council
- When new Noter available → Add to council (first 10 priority)
- If no Notaries available → Serok (president) can appoint manually

---

## 🧪 Testing

### Test 1: Single Member (Founder Only)
```bash
# 1. Start backend
npm run dev

# 2. Get council members
curl http://localhost:3001/api/council/members

# Expected: 1 member (founder delegate)

# 3. User applies KYC (via frontend)
# 4. Propose approval
curl -X POST http://localhost:3001/api/kyc/propose \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "proposerAddress": "5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3"
  }'

# Expected: Auto-execute (1/1 threshold reached)
```

### Test 2: 3 Members
```bash
# 1. Add 2 notaries
curl -X POST http://localhost:3001/api/council/add-member \
  -d '{"address": "5HpG...vSKr"}'

curl -X POST http://localhost:3001/api/council/add-member \
  -d '{"address": "5FLe...dXRp"}'

# 2. Council: 3 members, threshold = 2 votes (60% of 3 = 1.8 → ceil = 2)

# 3. Propose
curl -X POST http://localhost:3001/api/kyc/propose \
  -d '{
    "userAddress": "5Grw...utQY",
    "proposerAddress": "5DFw...Dwd3"
  }'

# Status: 1/2 (proposer voted AYE)

# 4. Vote from member 2
curl -X POST http://localhost:3001/api/kyc/vote \
  -d '{
    "userAddress": "5Grw...utQY",
    "voterAddress": "5HpG...vSKr",
    "approve": true
  }'

# Expected: Auto-execute (2/2 threshold reached) ✅
```

---

## 📊 Monitoring

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "blockchain": "connected",
  "sudoAccount": "5DFw...Dwd3",
  "councilMembers": 11,
  "pendingVotes": 3
}
```

### Console Logs
```
🔗 Connecting to PezkuwiChain...
✅ Sudo account loaded: 5DFw...Dwd3
✅ Connected to blockchain
📊 Chain: PezkuwiChain
🏛️  Runtime version: 106

🚀 KYC Council Backend running on port 3001
📊 Council members: 1
🎯 Threshold: 60%

📝 KYC proposal created for 5Grw...utQY by 5DFw...Dwd3
📊 Votes: 1/1 (1 members, 60% threshold)
🎉 Threshold reached for 5Grw...utQY! Executing approve_kyc...
📡 Transaction status: Ready
📡 Transaction status: InBlock
✅ KYC APPROVED for 5Grw...utQY
🏛️  User will receive Welati NFT automatically
```

---

## 🔄 Integration with Frontend

### Option A: Direct Backend API Calls
Frontend calls backend endpoints directly (simpler for MVP).

```typescript
// Propose KYC approval
const response = await fetch('http://localhost:3001/api/kyc/propose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userAddress: application.address,
    proposerAddress: selectedAccount.address,
    signature: await signMessage(...)
  })
});
```

### Option B: Blockchain Events + Backend Sync
Backend listens to blockchain events and auto-tracks proposals (future enhancement).

---

## 🚨 Security Considerations

1. **SUDO Account Protection:**
   - Use dedicated hardware wallet (Ledger recommended)
   - Only use for KYC approvals, nothing else
   - Consider multi-sig in production

2. **Signature Verification:**
   - TODO: Implement Polkadot signature verification
   - Prevent vote spam from non-members

3. **Rate Limiting:**
   - Add rate limiting to API endpoints
   - Prevent DoS attacks

4. **Audit Trail:**
   - Log all votes to database (future enhancement)
   - Track council member changes

---

## 📝 TODO

- [ ] Implement signature verification
- [ ] Add database persistence (replace in-memory Maps)
- [ ] Add rate limiting middleware
- [ ] Add automated council sync cron job
- [ ] Add multi-sig support for sudo account
- [ ] Add audit logging
- [ ] Add Prometheus metrics
- [ ] Add Docker support

---

## 📞 Support

**Backend Developer:** [Your contact]
**Runtime Issues:** Check `/Pezkuwi-SDK/pezkuwi/pallets/identity-kyc`
**Frontend Integration:** See `/pwap/ADMIN_KYC_GUIDE.md`

---

**Version:** 1.0 (Backend Council MVP)
**Last Updated:** 17 Kasım 2025
