// ========================================
// Citizenship Crypto Utilities
// ========================================
// Handles encryption, hashing, signatures for citizenship data

import { web3FromAddress } from '@polkadot/extension-dapp';
import { stringToHex, hexToU8a, u8aToHex, stringToU8a } from '@polkadot/util';
import { decodeAddress, signatureVerify, cryptoWaitReady } from '@polkadot/util-crypto';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { CitizenshipData } from './citizenship-workflow';

// ========================================
// HASHING FUNCTIONS
// ========================================

/**
 * Generate SHA-256 hash from data
 */
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
}

/**
 * Generate commitment hash from citizenship data
 */
export async function generateCommitmentHash(
  data: CitizenshipData
): Promise<string> {
  const dataString = JSON.stringify({
    fullName: data.fullName,
    fatherName: data.fatherName,
    grandfatherName: data.grandfatherName,
    motherName: data.motherName,
    tribe: data.tribe,
    maritalStatus: data.maritalStatus,
    childrenCount: data.childrenCount,
    children: data.children,
    region: data.region,
    email: data.email,
    profession: data.profession,
    referralCode: data.referralCode,
    walletAddress: data.walletAddress,
    timestamp: data.timestamp
  });

  return generateHash(dataString);
}

/**
 * Generate nullifier hash (prevents double-registration)
 */
export async function generateNullifierHash(
  walletAddress: string,
  timestamp: number
): Promise<string> {
  const nullifierData = `${walletAddress}-${timestamp}-nullifier`;
  return generateHash(nullifierData);
}

// ========================================
// ENCRYPTION / DECRYPTION (AES-GCM)
// ========================================

/**
 * Derive encryption key from wallet address
 * NOTE: For MVP, we use a deterministic key. For production, use proper key derivation
 */
async function deriveEncryptionKey(walletAddress: string): Promise<CryptoKey> {
  // Create a deterministic seed from wallet address
  const seed = await generateHash(walletAddress);

  // Convert hex to ArrayBuffer
  const keyMaterial = hexToU8a(seed).slice(0, 32); // 256-bit key

  // Import as AES-GCM key
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt citizenship data
 */
export async function encryptData(
  data: CitizenshipData,
  walletAddress: string
): Promise<string> {
  try {
    const key = await deriveEncryptionKey(walletAddress);

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to hex
    return u8aToHex(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt citizenship data
 */
export async function decryptData(
  encryptedHex: string,
  walletAddress: string
): Promise<CitizenshipData> {
  try {
    const key = await deriveEncryptionKey(walletAddress);

    // Convert hex to Uint8Array
    const combined = hexToU8a(encryptedHex);

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    // Convert to string and parse JSON
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);

    return JSON.parse(decryptedString) as CitizenshipData;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// ========================================
// SIGNATURE GENERATION & VERIFICATION
// ========================================

export interface AuthChallenge {
  nonce: string;          // Random UUID
  timestamp: number;      // Current timestamp
  tikiNumber: string;     // NFT number to prove
  expiresAt: number;      // Expiry timestamp (5 min)
}

/**
 * Generate authentication challenge
 */
export function generateAuthChallenge(tikiNumber: string): AuthChallenge {
  const now = Date.now();
  const nonce = crypto.randomUUID();

  return {
    nonce,
    timestamp: now,
    tikiNumber,
    expiresAt: now + (5 * 60 * 1000) // 5 minutes
  };
}

/**
 * Format challenge message for signing
 */
export function formatChallengeMessage(challenge: AuthChallenge): string {
  return `Prove ownership of Welati Tiki #${challenge.tikiNumber}

Nonce: ${challenge.nonce}
Timestamp: ${challenge.timestamp}
Expires: ${new Date(challenge.expiresAt).toISOString()}

By signing this message, you prove you control the wallet that owns this Tiki NFT.`;
}

/**
 * Sign authentication challenge with wallet
 */
export async function signChallenge(
  account: InjectedAccountWithMeta,
  challenge: AuthChallenge
): Promise<string> {
  try {
    await cryptoWaitReady();

    const injector = await web3FromAddress(account.address);
    const signRaw = injector?.signer?.signRaw;

    if (!signRaw) {
      throw new Error('Signer not available');
    }

    const message = formatChallengeMessage(challenge);

    const { signature } = await signRaw({
      address: account.address,
      data: stringToHex(message),
      type: 'bytes'
    });

    return signature;
  } catch (error) {
    console.error('Signature error:', error);
    throw new Error('Failed to sign challenge');
  }
}

/**
 * Verify signature
 */
export async function verifySignature(
  signature: string,
  challenge: AuthChallenge,
  expectedAddress: string
): Promise<boolean> {
  try {
    await cryptoWaitReady();

    // Check if challenge has expired
    if (Date.now() > challenge.expiresAt) {
      console.warn('Challenge has expired');
      return false;
    }

    const message = formatChallengeMessage(challenge);
    const messageU8a = stringToU8a(message);
    const signatureU8a = hexToU8a(signature);
    const publicKey = decodeAddress(expectedAddress);

    const result = signatureVerify(messageU8a, signatureU8a, publicKey);

    return result.isValid;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

// ========================================
// LOCAL STORAGE UTILITIES
// ========================================

const STORAGE_KEY_PREFIX = 'pezkuwi_citizen_';

export interface CitizenSession {
  tikiNumber: string;
  walletAddress: string;
  sessionToken: string;        // JWT-like token
  encryptedDataCID?: string;   // IPFS CID
  lastAuthenticated: number;   // Timestamp
  expiresAt: number;           // Session expiry (24h)
}

/**
 * Save encrypted citizen session to localStorage
 */
export async function saveCitizenSession(session: CitizenSession): Promise<void> {
  try {
    const sessionJson = JSON.stringify(session);
    const sessionKey = `${STORAGE_KEY_PREFIX}session`;

    // For MVP, store plainly. For production, encrypt with device key
    localStorage.setItem(sessionKey, sessionJson);
  } catch (error) {
    console.error('Error saving session:', error);
    throw new Error('Failed to save session');
  }
}

/**
 * Load citizen session from localStorage
 */
export function loadCitizenSession(): CitizenSession | null {
  try {
    const sessionKey = `${STORAGE_KEY_PREFIX}session`;
    const sessionJson = localStorage.getItem(sessionKey);

    if (!sessionJson) {
      return null;
    }

    const session = JSON.parse(sessionJson) as CitizenSession;

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      clearCitizenSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

/**
 * Clear citizen session from localStorage
 */
export function clearCitizenSession(): void {
  try {
    const sessionKey = `${STORAGE_KEY_PREFIX}session`;
    localStorage.removeItem(sessionKey);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Save encrypted citizenship data to localStorage (backup)
 */
export async function saveLocalCitizenshipData(
  data: CitizenshipData,
  walletAddress: string
): Promise<void> {
  try {
    const encrypted = await encryptData(data, walletAddress);
    const dataKey = `${STORAGE_KEY_PREFIX}data_${walletAddress}`;

    localStorage.setItem(dataKey, encrypted);
  } catch (error) {
    console.error('Error saving citizenship data:', error);
    throw new Error('Failed to save citizenship data');
  }
}

/**
 * Load encrypted citizenship data from localStorage
 */
export async function loadLocalCitizenshipData(
  walletAddress: string
): Promise<CitizenshipData | null> {
  try {
    const dataKey = `${STORAGE_KEY_PREFIX}data_${walletAddress}`;
    const encrypted = localStorage.getItem(dataKey);

    if (!encrypted) {
      return null;
    }

    return await decryptData(encrypted, walletAddress);
  } catch (error) {
    console.error('Error loading citizenship data:', error);
    return null;
  }
}

// ========================================
// IPFS UTILITIES (Placeholder)
// ========================================

/**
 * Upload encrypted data to IPFS
 * NOTE: This is a placeholder. Implement with actual IPFS client (Pinata, Web3.Storage, etc.)
 */
export async function uploadToIPFS(encryptedData: string): Promise<string> {
  // TODO: Implement actual IPFS upload
  // For MVP, we can use Pinata API or Web3.Storage

  console.warn('IPFS upload not yet implemented. Using mock CID.');

  // Mock CID for development
  const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}`;

  return mockCid;
}

/**
 * Fetch encrypted data from IPFS
 * NOTE: This is a placeholder. Implement with actual IPFS client
 */
export async function fetchFromIPFS(cid: string): Promise<string> {
  // TODO: Implement actual IPFS fetch
  // For MVP, use public IPFS gateways or dedicated service

  console.warn('IPFS fetch not yet implemented. Returning mock data.');

  // Mock encrypted data
  return '0x000000000000000000000000';
}
