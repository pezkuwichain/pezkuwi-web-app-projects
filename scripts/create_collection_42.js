#!/usr/bin/env node
/**
 * Creates NFT Collection #42 for Tiki citizenship system
 *
 * IMPORTANT: This script ensures Collection 42 exists before citizenship NFTs can be minted.
 * Must be run after chain initialization and before any citizenship operations.
 *
 * Usage:
 *   node scripts/create_collection_42.js [ws://127.0.0.1:9944]
 */

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

async function createCollection42() {
  // Get WebSocket endpoint from args or use default
  const wsEndpoint = process.argv[2] || 'ws://127.0.0.1:9944';

  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  console.log(`🔗 Connected to ${wsEndpoint}\n`);
  console.log('🎯 Target: Create NFT Collection #42 for Tiki citizenship system\n');

  // Check current NextCollectionId
  const nextCollectionId = await api.query.nfts.nextCollectionId();
  const currentId = nextCollectionId.isNone ? 0 : nextCollectionId.unwrap().toNumber();

  console.log(`📊 Current NextCollectionId: ${currentId}`);

  if (currentId > 42) {
    console.log('❌ ERROR: NextCollectionId is already past 42!');
    console.log('   Collection 42 cannot be created anymore.');
    console.log('   You need to start with a fresh chain.');
    process.exit(1);
  }

  if (currentId === 42) {
    console.log('✅ NextCollectionId is exactly 42! Creating Collection 42 now...\n');
    await createSingleCollection(api, alice, 42);
    await api.disconnect();
    process.exit(0);
  }

  // Need to create multiple collections to reach 42
  const collectionsToCreate = 42 - currentId + 1;
  console.log(`📝 Need to create ${collectionsToCreate} collections (IDs ${currentId} through 42)\n`);

  // Create collections in batches to reach 42
  for (let i = currentId; i <= 42; i++) {
    await createSingleCollection(api, alice, i);
  }

  console.log('\n🎉 Success! Collection 42 has been created and is ready for Tiki citizenship NFTs.');
  console.log('   You can now use the self-confirmation citizenship system.');

  await api.disconnect();
}

async function createSingleCollection(api, signer, expectedId) {
  return new Promise((resolve, reject) => {
    const config = api.createType('PalletNftsCollectionConfig', {
      settings: 0,
      maxSupply: null,
      mintSettings: {
        mintType: { Issuer: null },
        price: null,
        startBlock: null,
        endBlock: null,
        defaultItemSettings: 0
      }
    });

    const tx = api.tx.sudo.sudo(
      api.tx.nfts.forceCreate(
        { Id: signer.address },
        config
      )
    );

    console.log(`   Creating Collection #${expectedId}...`);

    tx.signAndSend(signer, ({ status, events, dispatchError }) => {
      if (status.isInBlock || status.isFinalized) {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }
          console.log(`   ❌ Error: ${errorMessage}`);
          reject(new Error(errorMessage));
          return;
        }

        let createdCollectionId = null;
        events.forEach(({ event }) => {
          if (event.section === 'nfts' && event.method === 'ForceCreated') {
            createdCollectionId = event.data[0].toNumber();
          }
        });

        if (createdCollectionId !== null) {
          if (createdCollectionId === expectedId) {
            if (expectedId === 42) {
              console.log(`   ✅ Collection #${createdCollectionId} created! 🎯 THIS IS THE TIKI COLLECTION!`);
            } else {
              console.log(`   ✓ Collection #${createdCollectionId} created (placeholder)`);
            }
          } else {
            console.log(`   ⚠️  Warning: Expected #${expectedId} but got #${createdCollectionId}`);
          }
        }

        resolve(createdCollectionId);
      }
    }).catch(reject);
  });
}

// Handle errors
createCollection42().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
