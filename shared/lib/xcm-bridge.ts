/**
 * XCM Bridge Service
 *
 * Handles Asset Hub USDT → wUSDT bridge configuration
 * User-friendly abstraction over complex XCM operations
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';

// Westend Asset Hub endpoint
export const ASSET_HUB_ENDPOINT = 'wss://westend-asset-hub-rpc.polkadot.io';

// Known Asset IDs
export const ASSET_HUB_USDT_ID = 1984; // USDT on Asset Hub
export const WUSDT_ASSET_ID = 1000;     // wUSDT on PezkuwiChain
export const ASSET_HUB_PARACHAIN_ID = 1000;

/**
 * Bridge status information
 */
export interface BridgeStatus {
  isConfigured: boolean;
  assetHubLocation: string | null;
  usdtMapping: number | null;
  assetHubConnected: boolean;
  wusdtExists: boolean;
}

/**
 * Asset Hub USDT metadata
 */
export interface AssetHubUsdtInfo {
  id: number;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
}

/**
 * Connect to Asset Hub
 */
export async function connectToAssetHub(): Promise<ApiPromise> {
  try {
    const provider = new WsProvider(ASSET_HUB_ENDPOINT);
    const api = await ApiPromise.create({ provider });
    await api.isReady;

    return api;
  } catch (error) {
    console.error('Failed to connect to Asset Hub:', error);
    throw new Error(`Asset Hub connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch Asset Hub USDT metadata
 */
export async function fetchAssetHubUsdtInfo(
  assetHubApi?: ApiPromise
): Promise<AssetHubUsdtInfo> {
  let api = assetHubApi;
  let shouldDisconnect = false;

  try {
    // Connect if not provided
    if (!api) {
      api = await connectToAssetHub();
      shouldDisconnect = true;
    }

    // Fetch USDT metadata from Asset Hub
    const metadata = await api.query.assets.metadata(ASSET_HUB_USDT_ID);
    const metadataJson = metadata.toJSON() as any;

    // Fetch total supply
    const asset = await api.query.assets.asset(ASSET_HUB_USDT_ID);
    const assetJson = asset.toJSON() as any;

    return {
      id: ASSET_HUB_USDT_ID,
      name: metadataJson?.name || 'Unknown',
      symbol: metadataJson?.symbol || 'USDT',
      decimals: metadataJson?.decimals || 6,
      supply: assetJson?.supply?.toString() || '0',
    };
  } catch (error) {
    console.error('Failed to fetch Asset Hub USDT info:', error);
    throw new Error(`Failed to fetch USDT info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (shouldDisconnect && api) {
      await api.disconnect();
    }
  }
}

/**
 * Check current XCM bridge configuration status
 */
export async function checkBridgeStatus(
  api: ApiPromise
): Promise<BridgeStatus> {
  try {
    // Check if wUSDT asset exists
    const wusdtAsset = await api.query.assets.asset(WUSDT_ASSET_ID);
    const wusdtExists = wusdtAsset.isSome;

    // Try to connect to Asset Hub
    let assetHubConnected = false;
    try {
      const assetHubApi = await connectToAssetHub();
      assetHubConnected = assetHubApi.isConnected;
      await assetHubApi.disconnect();
    } catch {
      assetHubConnected = false;
    }

    // TODO: Check XCM configuration
    // This requires checking the runtime configuration
    // For now, we'll return a basic status
    const isConfigured = false; // Will be updated when XCM pallet is available

    return {
      isConfigured,
      assetHubLocation: isConfigured ? `ParaId(${ASSET_HUB_PARACHAIN_ID})` : null,
      usdtMapping: isConfigured ? WUSDT_ASSET_ID : null,
      assetHubConnected,
      wusdtExists,
    };
  } catch (error) {
    console.error('Failed to check bridge status:', error);
    return {
      isConfigured: false,
      assetHubLocation: null,
      usdtMapping: null,
      assetHubConnected: false,
      wusdtExists: false,
    };
  }
}

/**
 * Configure XCM bridge (requires sudo access)
 *
 * This sets up the ForeignAssetTransactor to map Asset Hub USDT → wUSDT
 */
export async function configureXcmBridge(
  api: ApiPromise,
  signer: Signer,
  account: string,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  if (!api.tx.sudo) {
    throw new Error('Sudo pallet not available');
  }

  try {
    onStatusUpdate?.('Preparing XCM configuration...');

    // Create Asset Hub location
    const assetHubLocation = {
      parents: 1,
      interior: {
        X2: [
          { Parachain: ASSET_HUB_PARACHAIN_ID },
          { GeneralIndex: ASSET_HUB_USDT_ID }
        ]
      }
    };

    // Note: This is a placeholder for the actual XCM configuration
    // The actual implementation depends on the runtime's XCM configuration pallet
    // For now, we'll document the expected transaction structure

    console.log('XCM Configuration (Placeholder):', {
      assetHubLocation,
      wusdtAssetId: WUSDT_ASSET_ID,
      note: 'Actual implementation requires XCM config pallet in runtime'
    });

    onStatusUpdate?.('Waiting for user signature...');

    // TODO: Implement actual XCM configuration when pallet is available
    // const configTx = api.tx.sudo.sudo(
    //   api.tx.xcmConfig.configureForeignAsset(assetHubLocation, WUSDT_ASSET_ID)
    // );

    // For now, return a placeholder
    return 'XCM configuration transaction placeholder - requires runtime XCM config pallet';

  } catch (error) {
    console.error('Failed to configure XCM bridge:', error);
    throw new Error(`XCM configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create wUSDT/HEZ liquidity pool
 */
export async function createWUsdtHezPool(
  api: ApiPromise,
  signer: Signer,
  account: string,
  wusdtAmount: string,
  hezAmount: string,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  try {
    onStatusUpdate?.('Creating wUSDT/HEZ pool...');

    // Create pool transaction
    const poolTx = api.tx.assetConversion.createPool(
      { Assets: WUSDT_ASSET_ID }, // wUSDT
      'Native' // Native HEZ
    );

    onStatusUpdate?.('Adding initial liquidity...');

    // Add liquidity transaction
    const liquidityTx = api.tx.assetConversion.addLiquidity(
      { Assets: WUSDT_ASSET_ID },
      'Native',
      wusdtAmount,
      hezAmount,
      '0', // min_mint_amount
      account
    );

    onStatusUpdate?.('Batching transactions...');

    // Batch both transactions
    const batchTx = api.tx.utility.batchAll([poolTx, liquidityTx]);

    onStatusUpdate?.('Waiting for signature...');

    // Sign and send
    return new Promise((resolve, reject) => {
      batchTx.signAndSend(
        account,
        { signer },
        ({ status, dispatchError, events }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else {
              onStatusUpdate?.('Pool created successfully!');
              resolve(status.asInBlock.toHex());
            }
          }
        }
      );
    });
  } catch (error) {
    console.error('Failed to create wUSDT/HEZ pool:', error);
    throw new Error(`Pool creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify wUSDT asset exists on chain
 */
export async function verifyWUsdtAsset(api: ApiPromise): Promise<boolean> {
  try {
    const asset = await api.query.assets.asset(WUSDT_ASSET_ID);
    return asset.isSome;
  } catch (error) {
    console.error('Failed to verify wUSDT asset:', error);
    return false;
  }
}

/**
 * Get wUSDT asset details
 */
export async function getWUsdtAssetDetails(api: ApiPromise) {
  try {
    const [asset, metadata] = await Promise.all([
      api.query.assets.asset(WUSDT_ASSET_ID),
      api.query.assets.metadata(WUSDT_ASSET_ID),
    ]);

    if (!asset.isSome) {
      return null;
    }

    const assetData = asset.unwrap().toJSON() as any;
    const metadataData = metadata.toJSON() as any;

    return {
      supply: assetData.supply?.toString() || '0',
      owner: assetData.owner,
      issuer: assetData.issuer,
      admin: assetData.admin,
      freezer: assetData.freezer,
      minBalance: assetData.minBalance?.toString() || '0',
      name: metadataData.name || 'wUSDT',
      symbol: metadataData.symbol || 'wUSDT',
      decimals: metadataData.decimals || 6,
    };
  } catch (error) {
    console.error('Failed to get wUSDT asset details:', error);
    return null;
  }
}

/**
 * Format XCM location for display
 */
export function formatXcmLocation(location: any): string {
  if (typeof location === 'string') return location;

  try {
    if (location.parents !== undefined) {
      const junctions = location.interior?.X2 || location.interior?.X1 || [];
      return `RelayChain → ${junctions.map((j: any) => {
        if (j.Parachain) return `Para(${j.Parachain})`;
        if (j.GeneralIndex) return `Asset(${j.GeneralIndex})`;
        return JSON.stringify(j);
      }).join(' → ')}`;
    }
    return JSON.stringify(location);
  } catch {
    return 'Invalid location';
  }
}
