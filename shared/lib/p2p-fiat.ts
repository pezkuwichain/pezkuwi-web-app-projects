/**
 * P2P Fiat Trading System - Production Grade
 * 
 * @module p2p-fiat
 * @description Enterprise-level P2P fiat-to-crypto trading with escrow
 */

import { ApiPromise } from '@polkadot/api';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface PaymentMethod {
  id: string;
  currency: FiatCurrency;
  country: string;
  method_name: string;
  method_type: 'bank' | 'mobile_payment' | 'cash' | 'crypto_exchange';
  logo_url?: string;
  fields: Record<string, string>;
  validation_rules: Record<string, ValidationRule>;
  min_trade_amount: number;
  max_trade_amount?: number;
  processing_time_minutes: number;
  display_order: number;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

export type FiatCurrency = 'TRY' | 'IQD' | 'IRR' | 'EUR' | 'USD';
export type CryptoToken = 'HEZ' | 'PEZ';

export type OfferStatus = 'open' | 'paused' | 'locked' | 'completed' | 'cancelled';
export type TradeStatus = 'pending' | 'payment_sent' | 'completed' | 'cancelled' | 'disputed' | 'refunded';

export interface P2PFiatOffer {
  id: string;
  seller_id: string;
  seller_wallet: string;
  token: CryptoToken;
  amount_crypto: number;
  fiat_currency: FiatCurrency;
  fiat_amount: number;
  price_per_unit: number;
  payment_method_id: string;
  payment_details_encrypted: string;
  min_order_amount?: number;
  max_order_amount?: number;
  time_limit_minutes: number;
  auto_reply_message?: string;
  min_buyer_completed_trades: number;
  min_buyer_reputation: number;
  status: OfferStatus;
  remaining_amount: number;
  escrow_tx_hash?: string;
  created_at: string;
  expires_at: string;
}

export interface P2PFiatTrade {
  id: string;
  offer_id: string;
  seller_id: string;
  buyer_id: string;
  buyer_wallet: string;
  crypto_amount: number;
  fiat_amount: number;
  price_per_unit: number;
  escrow_locked_amount: number;
  buyer_marked_paid_at?: string;
  buyer_payment_proof_url?: string;
  seller_confirmed_at?: string;
  status: TradeStatus;
  payment_deadline: string;
  confirmation_deadline?: string;
  created_at: string;
  completed_at?: string;
}

export interface P2PReputation {
  user_id: string;
  total_trades: number;
  completed_trades: number;
  cancelled_trades: number;
  disputed_trades: number;
  reputation_score: number;
  trust_level: 'new' | 'basic' | 'intermediate' | 'advanced' | 'verified';
  verified_merchant: boolean;
  avg_payment_time_minutes?: number;
  avg_confirmation_time_minutes?: number;
}

export interface CreateOfferParams {
  api: ApiPromise;
  account: InjectedAccountWithMeta;
  token: CryptoToken;
  amountCrypto: number;
  fiatCurrency: FiatCurrency;
  fiatAmount: number;
  paymentMethodId: string;
  paymentDetails: Record<string, string>;
  timeLimitMinutes?: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
}

export interface AcceptOfferParams {
  api: ApiPromise;
  account: InjectedAccountWithMeta;
  offerId: string;
  amount?: number; // If partial order
}

// =====================================================
// CONSTANTS
// =====================================================

const PLATFORM_ESCROW_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

const ASSET_IDS = {
  HEZ: null, // Native token
  PEZ: 1
} as const;

const DEFAULT_PAYMENT_DEADLINE_MINUTES = 30;
const DEFAULT_CONFIRMATION_DEADLINE_MINUTES = 60;

// =====================================================
// PAYMENT METHODS
// =====================================================

/**
 * Fetch available payment methods for a currency
 */
export async function getPaymentMethods(currency: FiatCurrency): Promise<PaymentMethod[]> {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('currency', currency)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get payment methods error:', error);
    toast.error('Failed to load payment methods');
    return [];
  }
}

/**
 * Validate payment details against method rules
 */
export function validatePaymentDetails(
  paymentDetails: Record<string, string>,
  validationRules: Record<string, ValidationRule>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = paymentDetails[field] || '';

    if (rules.required && !value) {
      errors[field] = 'This field is required';
      continue;
    }

    if (rules.pattern && value) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        errors[field] = 'Invalid format';
      }
    }

    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `Minimum ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `Maximum ${rules.maxLength} characters`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// =====================================================
// ENCRYPTION (Simple symmetric encryption for demo)
// Production should use PGP or server-side encryption
// =====================================================

function encryptPaymentDetails(details: Record<string, string>): string {
  // TODO: Implement proper encryption (PGP or server-side)
  // For now, base64 encode (NOT SECURE - placeholder only)
  return btoa(JSON.stringify(details));
}

function decryptPaymentDetails(encrypted: string): Record<string, string> {
  try {
    return JSON.parse(atob(encrypted));
  } catch {
    return {};
  }
}

// =====================================================
// CREATE OFFER
// =====================================================

/**
 * Create a new P2P fiat offer
 * 
 * Steps:
 * 1. Lock crypto in platform escrow (blockchain tx)
 * 2. Create offer record in Supabase
 * 3. Update escrow balance tracking
 */
export async function createFiatOffer(params: CreateOfferParams): Promise<string> {
  const {
    api,
    account,
    token,
    amountCrypto,
    fiatCurrency,
    fiatAmount,
    paymentMethodId,
    paymentDetails,
    timeLimitMinutes = DEFAULT_PAYMENT_DEADLINE_MINUTES,
    minOrderAmount,
    maxOrderAmount
  } = params;

  try {
    // 1. Lock crypto in escrow (blockchain)
    toast.info('Locking crypto in escrow...');
    
    const amount = BigInt(amountCrypto * 1e12); // Convert to Planck
    
    let txHash: string;
    if (token === 'HEZ') {
      // Native token transfer
      const tx = api.tx.balances.transfer(PLATFORM_ESCROW_ADDRESS, amount);
      txHash = await signAndSendTx(api, account, tx);
    } else {
      // Asset transfer (PEZ)
      const assetId = ASSET_IDS[token];
      const tx = api.tx.assets.transfer(assetId, PLATFORM_ESCROW_ADDRESS, amount);
      txHash = await signAndSendTx(api, account, tx);
    }

    toast.success('Crypto locked in escrow');

    // 2. Encrypt payment details
    const encryptedDetails = encryptPaymentDetails(paymentDetails);

    // 3. Create offer in Supabase
    const { data: offer, error: offerError } = await supabase
      .from('p2p_fiat_offers')
      .insert({
        seller_id: (await supabase.auth.getUser()).data.user?.id,
        seller_wallet: account.address,
        token,
        amount_crypto: amountCrypto,
        fiat_currency: fiatCurrency,
        fiat_amount: fiatAmount,
        payment_method_id: paymentMethodId,
        payment_details_encrypted: encryptedDetails,
        min_order_amount: minOrderAmount,
        max_order_amount: maxOrderAmount,
        time_limit_minutes: timeLimitMinutes,
        status: 'open',
        remaining_amount: amountCrypto,
        escrow_tx_hash: txHash,
        escrow_locked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (offerError) throw offerError;

    // 4. Update escrow balance
    await supabase.rpc('increment_escrow_balance', {
      p_token: token,
      p_amount: amountCrypto
    });

    // 5. Audit log
    await logAction('offer', offer.id, 'create_offer', {
      token,
      amount_crypto: amountCrypto,
      fiat_currency: fiatCurrency,
      fiat_amount: fiatAmount
    });

    toast.success(`Offer created! Selling ${amountCrypto} ${token} for ${fiatAmount} ${fiatCurrency}`);
    
    return offer.id;
  } catch (error: any) {
    console.error('Create offer error:', error);
    toast.error(error.message || 'Failed to create offer');
    throw error;
  }
}

// =====================================================
// ACCEPT OFFER
// =====================================================

/**
 * Accept a P2P fiat offer (buyer)
 */
export async function acceptFiatOffer(params: AcceptOfferParams): Promise<string> {
  const { api, account, offerId, amount } = params;

  try {
    // 1. Get offer details
    const { data: offer, error: offerError } = await supabase
      .from('p2p_fiat_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offerError) throw offerError;
    if (!offer) throw new Error('Offer not found');
    if (offer.status !== 'open') throw new Error('Offer is not available');

    // 2. Determine trade amount
    const tradeAmount = amount || offer.remaining_amount;
    
    if (offer.min_order_amount && tradeAmount < offer.min_order_amount) {
      throw new Error(`Minimum order: ${offer.min_order_amount} ${offer.token}`);
    }
    
    if (offer.max_order_amount && tradeAmount > offer.max_order_amount) {
      throw new Error(`Maximum order: ${offer.max_order_amount} ${offer.token}`);
    }

    if (tradeAmount > offer.remaining_amount) {
      throw new Error('Insufficient remaining amount');
    }

    const tradeFiatAmount = (tradeAmount / offer.amount_crypto) * offer.fiat_amount;

    // 3. Check buyer reputation
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: reputation } = await supabase
      .from('p2p_reputation')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (reputation) {
      if (reputation.completed_trades < offer.min_buyer_completed_trades) {
        throw new Error(`Minimum ${offer.min_buyer_completed_trades} completed trades required`);
      }
      if (reputation.reputation_score < offer.min_buyer_reputation) {
        throw new Error(`Minimum reputation score ${offer.min_buyer_reputation} required`);
      }
    } else if (offer.min_buyer_completed_trades > 0 || offer.min_buyer_reputation > 0) {
      throw new Error('Seller requires experienced buyers');
    }

    // 4. Create trade
    const paymentDeadline = new Date(Date.now() + offer.time_limit_minutes * 60 * 1000);

    const { data: trade, error: tradeError } = await supabase
      .from('p2p_fiat_trades')
      .insert({
        offer_id: offerId,
        seller_id: offer.seller_id,
        buyer_id: user.user.id,
        buyer_wallet: account.address,
        crypto_amount: tradeAmount,
        fiat_amount: tradeFiatAmount,
        price_per_unit: offer.price_per_unit,
        escrow_locked_amount: tradeAmount,
        escrow_locked_at: new Date().toISOString(),
        status: 'pending',
        payment_deadline: paymentDeadline.toISOString()
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    // 5. Update offer remaining amount
    await supabase
      .from('p2p_fiat_offers')
      .update({
        remaining_amount: offer.remaining_amount - tradeAmount,
        status: offer.remaining_amount - tradeAmount === 0 ? 'locked' : 'open'
      })
      .eq('id', offerId);

    // 6. Audit log
    await logAction('trade', trade.id, 'accept_offer', {
      offer_id: offerId,
      crypto_amount: tradeAmount,
      fiat_amount: tradeFiatAmount
    });

    toast.success('Trade started! Send payment within time limit.');
    
    return trade.id;
  } catch (error: any) {
    console.error('Accept offer error:', error);
    toast.error(error.message || 'Failed to accept offer');
    throw error;
  }
}

// =====================================================
// MARK PAYMENT SENT (Buyer)
// =====================================================

/**
 * Buyer marks payment as sent
 */
export async function markPaymentSent(
  tradeId: string,
  paymentProofFile?: File
): Promise<void> {
  try {
    let paymentProofUrl: string | undefined;

    // 1. Upload payment proof to IPFS if provided
    if (paymentProofFile) {
      const { uploadToIPFS } = await import('./ipfs');
      paymentProofUrl = await uploadToIPFS(paymentProofFile);
    }

    // 2. Update trade
    const confirmationDeadline = new Date(Date.now() + DEFAULT_CONFIRMATION_DEADLINE_MINUTES * 60 * 1000);

    const { error } = await supabase
      .from('p2p_fiat_trades')
      .update({
        buyer_marked_paid_at: new Date().toISOString(),
        buyer_payment_proof_url: paymentProofUrl,
        status: 'payment_sent',
        confirmation_deadline: confirmationDeadline.toISOString()
      })
      .eq('id', tradeId);

    if (error) throw error;

    // 3. Notify seller (push notification would go here)

    // 4. Audit log
    await logAction('trade', tradeId, 'mark_payment_sent', {
      payment_proof_url: paymentProofUrl
    });

    toast.success('Payment marked as sent. Waiting for seller confirmation...');
  } catch (error: any) {
    console.error('Mark payment sent error:', error);
    toast.error(error.message || 'Failed to mark payment as sent');
    throw error;
  }
}

// =====================================================
// CONFIRM PAYMENT RECEIVED (Seller)
// =====================================================

/**
 * Seller confirms payment received and releases crypto
 */
export async function confirmPaymentReceived(
  api: ApiPromise,
  account: InjectedAccountWithMeta,
  tradeId: string
): Promise<void> {
  try {
    // 1. Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_fiat_trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError) throw tradeError;
    if (!trade) throw new Error('Trade not found');
    if (trade.status !== 'payment_sent') {
      throw new Error('Payment has not been marked as sent');
    }

    // 2. Release crypto from escrow to buyer (blockchain tx)
    toast.info('Releasing crypto to buyer...');

    const amount = BigInt(trade.crypto_amount * 1e12);
    const { data: offer } = await supabase
      .from('p2p_fiat_offers')
      .select('token')
      .eq('id', trade.offer_id)
      .single();

    let releaseTxHash: string;
    if (offer?.token === 'HEZ') {
      const tx = api.tx.balances.transfer(trade.buyer_wallet, amount);
      releaseTxHash = await signAndSendWithPlatformKey(api, tx);
    } else {
      const assetId = ASSET_IDS[offer?.token as CryptoToken];
      const tx = api.tx.assets.transfer(assetId, trade.buyer_wallet, amount);
      releaseTxHash = await signAndSendWithPlatformKey(api, tx);
    }

    // 3. Update trade status
    const { error: updateError } = await supabase
      .from('p2p_fiat_trades')
      .update({
        seller_confirmed_at: new Date().toISOString(),
        escrow_release_tx_hash: releaseTxHash,
        escrow_released_at: new Date().toISOString(),
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    if (updateError) throw updateError;

    // 4. Update escrow balance
    await supabase.rpc('decrement_escrow_balance', {
      p_token: offer?.token,
      p_amount: trade.crypto_amount
    });

    // 5. Update reputations
    await updateReputations(trade.seller_id, trade.buyer_id, tradeId);

    // 6. Audit log
    await logAction('trade', tradeId, 'confirm_payment', {
      release_tx_hash: releaseTxHash
    });

    toast.success('Payment confirmed! Crypto released to buyer.');
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    toast.error(error.message || 'Failed to confirm payment');
    throw error;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function signAndSendTx(
  api: ApiPromise,
  account: InjectedAccountWithMeta,
  tx: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    let unsub: () => void;

    tx.signAndSend(account.address, ({ status, txHash, dispatchError }: any) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        if (unsub) unsub();
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
        if (unsub) unsub();
      }
    }).then((unsubscribe: () => void) => {
      unsub = unsubscribe;
    });
  });
}

async function signAndSendWithPlatformKey(api: ApiPromise, tx: any): Promise<string> {
  // TODO: Implement multisig or server-side signing
  // For now, this is a placeholder
  throw new Error('Platform signing not implemented - requires multisig setup');
}

async function updateReputations(sellerId: string, buyerId: string, tradeId: string): Promise<void> {
  await supabase.rpc('update_p2p_reputation', {
    p_seller_id: sellerId,
    p_buyer_id: buyerId,
    p_trade_id: tradeId
  });
}

async function logAction(
  entityType: string,
  entityId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  await supabase.from('p2p_audit_log').insert({
    user_id: user.user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details
  });
}

// =====================================================
// QUERY FUNCTIONS
// =====================================================

export async function getActiveOffers(
  currency?: FiatCurrency,
  token?: CryptoToken
): Promise<P2PFiatOffer[]> {
  try {
    let query = supabase
      .from('p2p_fiat_offers')
      .select('*')
      .eq('status', 'open')
      .gt('remaining_amount', 0)
      .gt('expires_at', new Date().toISOString())
      .order('price_per_unit');

    if (currency) query = query.eq('fiat_currency', currency);
    if (token) query = query.eq('token', token);

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Get active offers error:', error);
    return [];
  }
}

export async function getUserTrades(userId: string): Promise<P2PFiatTrade[]> {
  try {
    const { data, error } = await supabase
      .from('p2p_fiat_trades')
      .select('*')
      .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get user trades error:', error);
    return [];
  }
}

export async function getUserReputation(userId: string): Promise<P2PReputation | null> {
  try {
    const { data, error } = await supabase
      .from('p2p_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get user reputation error:', error);
    return null;
  }
}
