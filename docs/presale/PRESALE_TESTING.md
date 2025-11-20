# Presale System Testing Checklist

## Test Environment Setup
- [ ] Runtime compiled with presale pallet
- [ ] Frontend build successful
- [ ] Dev node running
- [ ] Test accounts with wUSDT funded

## Pallet Tests (Backend)

### 1. Start Presale
- [ ] Only sudo can start presale
- [ ] PresaleActive storage updated to true
- [ ] PresaleStartBlock recorded
- [ ] PresaleStarted event emitted
- [ ] Cannot start if already started

### 2. Contribute
- [ ] User can contribute wUSDT
- [ ] wUSDT transferred from user to treasury
- [ ] Contribution recorded in Contributions storage
- [ ] Contributor added to Contributors list (first time)
- [ ] TotalRaised incremented correctly
- [ ] Contributed event emitted
- [ ] Cannot contribute zero amount
- [ ] Cannot contribute if presale not active
- [ ] Cannot contribute if presale ended
- [ ] Cannot contribute if paused

### 3. Finalize Presale
- [ ] Only sudo can finalize
- [ ] Cannot finalize before presale ends
- [ ] PEZ distributed to all contributors
- [ ] Distribution calculation correct (1 wUSDT = 20 PEZ)
- [ ] Decimal conversion correct (wUSDT 6 decimals → PEZ 12 decimals)
- [ ] PresaleActive set to false
- [ ] PresaleFinalized event emitted
- [ ] Distributed events for each contributor

### 4. Emergency Functions
- [ ] Only sudo can pause
- [ ] Paused flag prevents contributions
- [ ] Only sudo can unpause
- [ ] EmergencyPaused/Unpaused events emitted

### 5. Edge Cases
- [ ] Multiple contributions from same user accumulate
- [ ] Large numbers don't overflow
- [ ] Contributors list doesn't exceed MaxContributors
- [ ] Treasury has sufficient PEZ for distribution

## Frontend Tests (UI)

### 1. Pre-Sale Not Started
- [ ] Shows "not started" message
- [ ] Displays pre-sale details (duration, rate, token)
- [ ] No contribution form visible

### 2. Pre-Sale Active
- [ ] Stats grid displays:
  - [ ] Time remaining (countdown)
  - [ ] Total raised (in USDT)
  - [ ] Contributors count
  - [ ] User's contribution
- [ ] Progress bar shows percentage
- [ ] Conversion rate displays correctly (1 wUSDT = 20 PEZ)

### 3. Contribution Form
- [ ] Wallet connection required
- [ ] wUSDT balance displayed
- [ ] Amount input validation
- [ ] PEZ calculation preview (amount × 20)
- [ ] Submit button disabled when:
  - [ ] No wallet connected
  - [ ] No amount entered
  - [ ] Presale paused
  - [ ] Loading state
- [ ] Success toast on contribution
- [ ] Error toast on failure
- [ ] Balance warning if insufficient wUSDT

### 4. Paused State
- [ ] Yellow alert banner shows
- [ ] Contribution disabled
- [ ] Message: "temporarily paused"

### 5. Real-time Updates
- [ ] Data refreshes every 10 seconds
- [ ] Countdown updates
- [ ] Stats update after contribution
- [ ] No memory leaks (interval cleanup)

## Integration Tests

### 1. End-to-End Flow
- [ ] User bridges USDT to wUSDT
- [ ] Connects wallet to presale page
- [ ] Enters contribution amount
- [ ] Transaction signed and submitted
- [ ] Contribution recorded on-chain
- [ ] UI updates with new values
- [ ] After 45 days, receives PEZ

### 2. Multi-User Scenario
- [ ] Multiple users contribute
- [ ] Contributors count increases
- [ ] Total raised accumulates
- [ ] Each user sees own contribution
- [ ] Finalization distributes to all

### 3. Error Scenarios
- [ ] Insufficient wUSDT balance → error toast
- [ ] Network error → retry mechanism
- [ ] Transaction rejected → graceful failure
- [ ] Invalid amount → validation error

## Performance Tests

- [ ] Load time acceptable (<3s)
- [ ] Transaction completion time (<30s)
- [ ] Query performance with 1000+ contributors
- [ ] Frontend responsive on mobile
- [ ] No console errors
- [ ] Build size reasonable

## Security Checks

- [ ] Only root can start/finalize/pause
- [ ] Users can't withdraw contributed wUSDT
- [ ] PEZ distribution only after 45 days
- [ ] No integer overflow in calculations
- [ ] Treasury account properly secured
- [ ] Events emitted for audit trail

## Documentation

- [ ] README explains presale process
- [ ] User guide for participation
- [ ] Admin guide for starting/finalizing
- [ ] API documentation for extrinsics
- [ ] Frontend component documentation

## Deployment Checklist

- [ ] Runtime upgrade tested on testnet
- [ ] Frontend deployed to staging
- [ ] Conversion rate confirmed (20x)
- [ ] Treasury pre-funded with PEZ
- [ ] Monitoring alerts configured
- [ ] Backup plan for emergencies

## Known Issues / Limitations

- Mock runtime tests disabled (frame_system compatibility)
- Benchmarks use estimated weights (not real hardware)
- Max 10,000 contributors (MaxContributors limit)

## Test Results

| Test Category | Pass | Fail | Notes |
|--------------|------|------|-------|
| Pallet Logic | TBD  | TBD  |       |
| Frontend UI  | TBD  | TBD  |       |
| Integration  | TBD  | TBD  |       |
| Performance  | TBD  | TBD  |       |
| Security     | TBD  | TBD  |       |

---

**Testing Status**: In Progress
**Last Updated**: 2025-01-20
**Tester**: Claude Code
