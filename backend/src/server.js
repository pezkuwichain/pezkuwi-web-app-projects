import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ========================================
// KYC COUNCIL STATE
// ========================================

// Council members (wallet addresses)
const councilMembers = new Set([
  '5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3' // Initial: Founder's delegate
]);

// Pending KYC votes: Map<userAddress, { ayes: Set, nays: Set, proposer, timestamp }>
const kycVotes = new Map();

// Threshold: 60%
const THRESHOLD_PERCENT = 0.6;

// Sudo account for signing approve_kyc
let sudoAccount = null;
let api = null;

// ========================================
// BLOCKCHAIN CONNECTION
// ========================================

async function initBlockchain() {
  console.log('🔗 Connecting to PezkuwiChain...');

  const wsProvider = new WsProvider(process.env.WS_ENDPOINT || 'wss://ws.pezkuwichain.io');
  api = await ApiPromise.create({ provider: wsProvider });

  await cryptoWaitReady();

  // Initialize sudo account from env
  if (process.env.SUDO_SEED) {
    const keyring = new Keyring({ type: 'sr25519' });
    sudoAccount = keyring.addFromUri(process.env.SUDO_SEED);
    console.log('✅ Sudo account loaded:', sudoAccount.address);
  } else {
    console.warn('⚠️  No SUDO_SEED in .env - auto-approval disabled');
  }

  console.log('✅ Connected to blockchain');
  console.log('📊 Chain:', await api.rpc.system.chain());
  console.log('🏛️  Runtime version:', api.runtimeVersion.specVersion.toNumber());
}

// ========================================
// COUNCIL MANAGEMENT
// ========================================

// Add member to council (only founder/sudo can call)
app.post('/api/council/add-member', async (req, res) => {
  const { address, signature } = req.body;

  // TODO: Verify signature from founder
  // For now, just add

  if (!address || address.length < 47) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  councilMembers.add(address);

  console.log(`✅ Council member added: ${address}`);
  console.log(`📊 Total members: ${councilMembers.size}`);

  res.json({
    success: true,
    totalMembers: councilMembers.size,
    members: Array.from(councilMembers)
  });
});

// Remove member from council
app.post('/api/council/remove-member', async (req, res) => {
  const { address } = req.body;

  if (!councilMembers.has(address)) {
    return res.status(404).json({ error: 'Member not found' });
  }

  councilMembers.delete(address);

  console.log(`❌ Council member removed: ${address}`);
  console.log(`📊 Total members: ${councilMembers.size}`);

  res.json({
    success: true,
    totalMembers: councilMembers.size,
    members: Array.from(councilMembers)
  });
});

// Get council members
app.get('/api/council/members', (req, res) => {
  res.json({
    members: Array.from(councilMembers),
    totalMembers: councilMembers.size,
    threshold: THRESHOLD_PERCENT,
    votesRequired: Math.ceil(councilMembers.size * THRESHOLD_PERCENT)
  });
});

// ========================================
// KYC VOTING
// ========================================

// Propose KYC approval
app.post('/api/kyc/propose', async (req, res) => {
  const { userAddress, proposerAddress, signature } = req.body;

  // Verify proposer is council member
  if (!councilMembers.has(proposerAddress)) {
    return res.status(403).json({ error: 'Not a council member' });
  }

  // TODO: Verify signature

  // Check if already has votes
  if (kycVotes.has(userAddress)) {
    return res.status(400).json({ error: 'Proposal already exists' });
  }

  // Create vote record
  kycVotes.set(userAddress, {
    ayes: new Set([proposerAddress]), // Proposer auto-votes aye
    nays: new Set(),
    proposer: proposerAddress,
    timestamp: Date.now()
  });

  console.log(`📝 KYC proposal created for ${userAddress} by ${proposerAddress}`);

  // Check if threshold already met (e.g., only 1 member)
  await checkAndExecute(userAddress);

  res.json({
    success: true,
    userAddress,
    votesCount: 1,
    threshold: Math.ceil(councilMembers.size * THRESHOLD_PERCENT)
  });
});

// Vote on KYC proposal
app.post('/api/kyc/vote', async (req, res) => {
  const { userAddress, voterAddress, approve, signature } = req.body;

  // Verify voter is council member
  if (!councilMembers.has(voterAddress)) {
    return res.status(403).json({ error: 'Not a council member' });
  }

  // Check if proposal exists
  if (!kycVotes.has(userAddress)) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  // TODO: Verify signature

  const votes = kycVotes.get(userAddress);

  // Add vote
  if (approve) {
    votes.nays.delete(voterAddress); // Remove from nays if exists
    votes.ayes.add(voterAddress);
    console.log(`✅ AYE vote from ${voterAddress} for ${userAddress}`);
  } else {
    votes.ayes.delete(voterAddress); // Remove from ayes if exists
    votes.nays.add(voterAddress);
    console.log(`❌ NAY vote from ${voterAddress} for ${userAddress}`);
  }

  // Check if threshold reached
  await checkAndExecute(userAddress);

  res.json({
    success: true,
    ayes: votes.ayes.size,
    nays: votes.nays.size,
    threshold: Math.ceil(councilMembers.size * THRESHOLD_PERCENT),
    status: votes.ayes.size >= Math.ceil(councilMembers.size * THRESHOLD_PERCENT) ? 'APPROVED' : 'VOTING'
  });
});

// Check if threshold reached and execute approve_kyc
async function checkAndExecute(userAddress) {
  const votes = kycVotes.get(userAddress);
  if (!votes) return;

  const requiredVotes = Math.ceil(councilMembers.size * THRESHOLD_PERCENT);
  const currentAyes = votes.ayes.size;

  console.log(`📊 Votes: ${currentAyes}/${requiredVotes} (${councilMembers.size} members, ${THRESHOLD_PERCENT * 100}% threshold)`);

  if (currentAyes >= requiredVotes) {
    console.log(`🎉 Threshold reached for ${userAddress}! Executing approve_kyc...`);

    if (!sudoAccount || !api) {
      console.error('❌ Cannot execute: No sudo account or API connection');
      return;
    }

    try {
      // Submit approve_kyc transaction
      const tx = api.tx.identityKyc.approveKyc(userAddress);

      await new Promise((resolve, reject) => {
        tx.signAndSend(sudoAccount, ({ status, dispatchError, events }) => {
          console.log(`📡 Transaction status: ${status.type}`);

          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = 'Transaction failed';

              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              console.error(`❌ Approval failed: ${errorMessage}`);
              reject(new Error(errorMessage));
              return;
            }

            // Check for KycApproved event
            const approvedEvent = events.find(({ event }) =>
              event.section === 'identityKyc' && event.method === 'KycApproved'
            );

            if (approvedEvent) {
              console.log(`✅ KYC APPROVED for ${userAddress}`);
              console.log(`🏛️  User will receive Welati NFT automatically`);

              // Remove from pending votes
              kycVotes.delete(userAddress);

              resolve();
            } else {
              console.warn('⚠️  Transaction included but no KycApproved event');
              resolve();
            }
          }
        }).catch(reject);
      });

    } catch (error) {
      console.error(`❌ Error executing approve_kyc:`, error);
    }
  }
}

// Get pending KYC votes
app.get('/api/kyc/pending', (req, res) => {
  const pending = [];

  for (const [userAddress, votes] of kycVotes.entries()) {
    pending.push({
      userAddress,
      proposer: votes.proposer,
      ayes: Array.from(votes.ayes),
      nays: Array.from(votes.nays),
      timestamp: votes.timestamp,
      votesCount: votes.ayes.size,
      threshold: Math.ceil(councilMembers.size * THRESHOLD_PERCENT),
      status: votes.ayes.size >= Math.ceil(councilMembers.size * THRESHOLD_PERCENT) ? 'APPROVED' : 'VOTING'
    });
  }

  res.json({ pending });
});

// ========================================
// AUTO-UPDATE COUNCIL FROM BLOCKCHAIN
// ========================================

// Sync council with Noter tiki holders
app.post('/api/council/sync-notaries', async (req, res) => {
  if (!api) {
    return res.status(503).json({ error: 'Blockchain not connected' });
  }

  console.log('🔄 Syncing council with Noter tiki holders...');

  try {
    // Get all users with tikis
    const entries = await api.query.tiki.userTikis.entries();

    const notaries = [];
    const NOTER_INDEX = 9; // Noter tiki index

    for (const [key, tikis] of entries) {
      const address = key.args[0].toString();
      const tikiList = tikis.toJSON();

      // Check if user has Noter tiki
      if (tikiList && tikiList.includes(NOTER_INDEX)) {
        notaries.push(address);
      }
    }

    console.log(`📊 Found ${notaries.length} Noter tiki holders`);

    // Add first 10 notaries to council
    const founderDelegate = '5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3';
    councilMembers.clear();
    councilMembers.add(founderDelegate);

    notaries.slice(0, 10).forEach(address => {
      councilMembers.add(address);
    });

    console.log(`✅ Council updated: ${councilMembers.size} members`);

    res.json({
      success: true,
      totalMembers: councilMembers.size,
      members: Array.from(councilMembers),
      notariesFound: notaries.length
    });

  } catch (error) {
    console.error('❌ Error syncing notaries:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    blockchain: api ? 'connected' : 'disconnected',
    sudoAccount: sudoAccount ? sudoAccount.address : 'not configured',
    councilMembers: councilMembers.size,
    pendingVotes: kycVotes.size
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3001;

initBlockchain()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 KYC Council Backend running on port ${PORT}`);
      console.log(`📊 Council members: ${councilMembers.size}`);
      console.log(`🎯 Threshold: ${THRESHOLD_PERCENT * 100}%`);
    });
  })
  .catch(error => {
    console.error('❌ Failed to initialize blockchain:', error);
    process.exit(1);
  });
