-- =====================================================
-- P2P Fiat Trading System
-- Production-grade schema with full security & audit
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency TEXT NOT NULL CHECK (currency IN ('TRY', 'IQD', 'IRR', 'EUR', 'USD')),
  country TEXT NOT NULL,
  method_name TEXT NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank', 'mobile_payment', 'cash', 'crypto_exchange')),
  logo_url TEXT,
  fields JSONB NOT NULL,
  validation_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  min_trade_amount NUMERIC DEFAULT 0,
  max_trade_amount NUMERIC,
  processing_time_minutes INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_payment_method UNIQUE (currency, method_name)
);

CREATE INDEX idx_payment_methods_currency_active ON public.payment_methods(currency, is_active);
CREATE INDEX idx_payment_methods_type ON public.payment_methods(method_type);

-- =====================================================
-- P2P FIAT OFFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.p2p_fiat_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_wallet TEXT NOT NULL,
  
  -- Crypto side
  token TEXT NOT NULL CHECK (token IN ('HEZ', 'PEZ')),
  amount_crypto NUMERIC NOT NULL CHECK (amount_crypto > 0),
  
  -- Fiat side
  fiat_currency TEXT NOT NULL CHECK (fiat_currency IN ('TRY', 'IQD', 'IRR', 'EUR', 'USD')),
  fiat_amount NUMERIC NOT NULL CHECK (fiat_amount > 0),
  price_per_unit NUMERIC GENERATED ALWAYS AS (fiat_amount / amount_crypto) STORED,
  
  -- Payment details
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id),
  payment_details_encrypted TEXT NOT NULL, -- PGP encrypted JSONB
  
  -- Terms
  min_order_amount NUMERIC CHECK (min_order_amount > 0 AND min_order_amount <= amount_crypto),
  max_order_amount NUMERIC CHECK (max_order_amount >= min_order_amount AND max_order_amount <= amount_crypto),
  time_limit_minutes INT DEFAULT 30 CHECK (time_limit_minutes BETWEEN 15 AND 120),
  auto_reply_message TEXT,
  
  -- Restrictions
  min_buyer_completed_trades INT DEFAULT 0,
  min_buyer_reputation INT DEFAULT 0,
  blocked_users UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paused', 'locked', 'completed', 'cancelled')),
  remaining_amount NUMERIC NOT NULL CHECK (remaining_amount >= 0 AND remaining_amount <= amount_crypto),
  
  -- Escrow tracking
  escrow_tx_hash TEXT,
  escrow_locked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  CONSTRAINT check_order_amounts CHECK (
    (min_order_amount IS NULL AND max_order_amount IS NULL) OR
    (min_order_amount IS NOT NULL AND max_order_amount IS NOT NULL)
  )
);

CREATE INDEX idx_p2p_offers_seller ON public.p2p_fiat_offers(seller_id);
CREATE INDEX idx_p2p_offers_currency ON public.p2p_fiat_offers(fiat_currency, token);
CREATE INDEX idx_p2p_offers_status ON public.p2p_fiat_offers(status)WHERE status IN ('open', 'paused');
CREATE INDEX idx_p2p_offers_active ON public.p2p_fiat_offers(status, fiat_currency, token) 
  WHERE status = 'open' AND remaining_amount > 0;

-- =====================================================
-- P2P FIAT TRADES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.p2p_fiat_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES public.p2p_fiat_offers(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  buyer_wallet TEXT NOT NULL,
  
  -- Trade amounts
  crypto_amount NUMERIC NOT NULL CHECK (crypto_amount > 0),
  fiat_amount NUMERIC NOT NULL CHECK (fiat_amount > 0),
  price_per_unit NUMERIC NOT NULL,
  
  -- Escrow
  escrow_locked_amount NUMERIC NOT NULL,
  escrow_locked_at TIMESTAMPTZ,
  escrow_release_tx_hash TEXT,
  escrow_released_at TIMESTAMPTZ,
  
  -- Payment tracking
  buyer_marked_paid_at TIMESTAMPTZ,
  buyer_payment_proof_url TEXT, -- IPFS hash
  seller_confirmed_at TIMESTAMPTZ,
  
  -- Chat messages (encrypted)
  chat_messages JSONB DEFAULT '[]',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'payment_sent', 'completed', 'cancelled', 'disputed', 'refunded')
  ),
  
  -- Deadlines
  payment_deadline TIMESTAMPTZ NOT NULL,
  confirmation_deadline TIMESTAMPTZ,
  
  -- Cancellation/Dispute
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  dispute_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT different_users CHECK (seller_id != buyer_id)
);

CREATE INDEX idx_p2p_trades_offer ON public.p2p_fiat_trades(offer_id);
CREATE INDEX idx_p2p_trades_seller ON public.p2p_fiat_trades(seller_id);
CREATE INDEX idx_p2p_trades_buyer ON public.p2p_fiat_trades(buyer_id);
CREATE INDEX idx_p2p_trades_status ON public.p2p_fiat_trades(status);
CREATE INDEX idx_p2p_trades_deadlines ON public.p2p_fiat_trades(payment_deadline, confirmation_deadline) 
 WHERE status IN ('pending', 'payment_sent');

-- =====================================================
-- P2P DISPUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.p2p_fiat_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES public.p2p_fiat_trades(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Dispute details
  reason TEXT NOT NULL CHECK (LENGTH(reason) >= 20),
  category TEXT NOT NULL CHECK (
    category IN ('payment_not_received', 'wrong_amount', 'fake_payment_proof', 'other')
  ),
  evidence_urls TEXT[] DEFAULT '{}', -- IPFS hashes
  additional_info JSONB DEFAULT '{}',
  
  -- Moderator assignment
  assigned_moderator_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Resolution
  decision TEXT CHECK (decision IN ('release_to_buyer', 'refund_to_seller', 'split', 'escalate')),
  decision_reasoning TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')
  ),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT one_dispute_per_trade UNIQUE (trade_id)
);

CREATE INDEX idx_disputes_trade ON public.p2p_fiat_disputes(trade_id);
CREATE INDEX idx_disputes_status ON public.p2p_fiat_disputes(status)WHERE status IN ('open', 'under_review');
CREATE INDEX idx_disputes_moderator ON public.p2p_fiat_disputes(assigned_moderator_id) WHERE status = 'under_review';

-- =====================================================
-- P2P REPUTATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.p2p_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trade statistics
  total_trades INT DEFAULT 0 CHECK (total_trades >= 0),
  completed_trades INT DEFAULT 0 CHECK (completed_trades >= 0 AND completed_trades <= total_trades),
  cancelled_trades INT DEFAULT 0 CHECK (cancelled_trades >= 0),
  disputed_trades INT DEFAULT 0 CHECK (disputed_trades >= 0),
  
  -- Role statistics
  total_as_seller INT DEFAULT 0 CHECK (total_as_seller >= 0),
  total_as_buyer INT DEFAULT 0 CHECK (total_as_buyer >= 0),
  
  -- Volume
  total_volume_usd NUMERIC DEFAULT 0 CHECK (total_volume_usd >= 0),
  
  -- Timing metrics
  avg_payment_time_minutes INT,
  avg_confirmation_time_minutes INT,
  
  -- Reputation score (0-1000)
  reputation_score INT DEFAULT 100 CHECK (reputation_score BETWEEN 0 AND 1000),
  trust_level TEXT DEFAULT 'new' CHECK (
    trust_level IN ('new', 'basic', 'intermediate', 'advanced', 'verified')
  ),
  
  -- Badges
  verified_merchant BOOLEAN DEFAULT false,
  fast_trader BOOLEAN DEFAULT false,
  
  -- Restrictions
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  restricted_until TIMESTAMPTZ,
  
  -- Timestamps
  first_trade_at TIMESTAMPTZ,
  last_trade_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reputation_score ON public.p2p_reputation(reputation_score DESC);
CREATE INDEX idx_reputation_verified ON public.p2p_reputation(verified_merchant) WHERE verified_merchant = true;

-- =====================================================
-- PLATFORM ESCROW TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_escrow_balance (
  token TEXT PRIMARY KEY CHECK (token IN ('HEZ', 'PEZ')),
  total_locked NUMERIC DEFAULT 0 CHECK (total_locked >= 0),
  hot_wallet_address TEXT NOT NULL,
  last_audit_at TIMESTAMPTZ,
  last_audit_blockchain_balance NUMERIC,
  discrepancy NUMERIC GENERATED ALWAYS AS (last_audit_blockchain_balance - total_locked) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.p2p_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('offer', 'trade', 'dispute')),
  entity_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON public.p2p_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.p2p_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON public.p2p_audit_log(created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p2p_offers_updated_at BEFORE UPDATE ON public.p2p_fiat_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p2p_trades_updated_at BEFORE UPDATE ON public.p2p_fiat_trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p2p_disputes_updated_at BEFORE UPDATE ON public.p2p_fiat_disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Payment Methods: Public read
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods_public_read" ON public.payment_methods
  FOR SELECT USING (is_active = true);

CREATE POLICY "payment_methods_admin_all" ON public.payment_methods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- P2P Offers: Public read active, sellers manage own
ALTER TABLE public.p2p_fiat_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_public_read_active" ON public.p2p_fiat_offers
  FOR SELECT USING (
    status IN ('open', 'paused') AND 
    remaining_amount > 0 AND 
    expires_at > NOW()
  );

CREATE POLICY "offers_seller_read_own" ON public.p2p_fiat_offers
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "offers_seller_insert" ON public.p2p_fiat_offers
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "offers_seller_update_own" ON public.p2p_fiat_offers
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "offers_seller_delete_own" ON public.p2p_fiat_offers
  FOR DELETE USING (seller_id = auth.uid() AND status IN ('open', 'paused'));

-- P2P Trades: Parties can view/update own trades
ALTER TABLE public.p2p_fiat_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades_parties_read" ON public.p2p_fiat_trades
  FOR SELECT USING (seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "trades_buyer_insert" ON public.p2p_fiat_trades
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "trades_parties_update" ON public.p2p_fiat_trades
  FOR UPDATE USING (seller_id = auth.uid() OR buyer_id = auth.uid());

-- Disputes: Parties and moderators
ALTER TABLE public.p2p_fiat_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_parties_read" ON public.p2p_fiat_disputes
  FOR SELECT USING (
    opened_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.p2p_fiat_trades t 
      WHERE t.id = trade_id AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
    )
  );

CREATE POLICY "disputes_moderators_read" ON public.p2p_fiat_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "disputes_parties_insert" ON public.p2p_fiat_disputes
  FOR INSERT WITH CHECK (
    opened_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.p2p_fiat_trades t
      WHERE t.id = trade_id AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
    )
  );

-- Reputation: Public read, system updates
ALTER TABLE public.p2p_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reputation_public_read" ON public.p2p_reputation
  FOR SELECT USING (true);

-- Escrow: Admin only
ALTER TABLE public.platform_escrow_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "escrow_admin_only" ON public.platform_escrow_balance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- Audit log: Own + admins
ALTER TABLE public.p2p_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_user_read_own" ON public.p2p_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "audit_admin_read_all" ON public.p2p_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );
