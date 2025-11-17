-- =====================================================
-- P2P FIAT SYSTEM - RPC FUNCTIONS
-- Production-grade stored procedures
-- =====================================================

-- =====================================================
-- INCREMENT ESCROW BALANCE
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_escrow_balance(
  p_token TEXT,
  p_amount NUMERIC
) RETURNS void AS $$
BEGIN
  UPDATE public.platform_escrow_balance
  SET 
    total_locked = total_locked + p_amount,
    updated_at = NOW()
  WHERE token = p_token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token % not found in escrow balance', p_token;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DECREMENT ESCROW BALANCE
-- =====================================================
CREATE OR REPLACE FUNCTION public.decrement_escrow_balance(
  p_token TEXT,
  p_amount NUMERIC
) RETURNS void AS $$
BEGIN
  UPDATE public.platform_escrow_balance
  SET 
    total_locked = total_locked - p_amount,
    updated_at = NOW()
  WHERE token = p_token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token % not found in escrow balance', p_token;
  END IF;
  
  -- Check for negative balance (should never happen)
  IF (SELECT total_locked FROM public.platform_escrow_balance WHERE token = p_token) < 0 THEN
    RAISE EXCEPTION 'Escrow balance would go negative for token %', p_token;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE P2P REPUTATION AFTER TRADE
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_p2p_reputation(
  p_seller_id UUID,
  p_buyer_id UUID,
  p_trade_id UUID
) RETURNS void AS $$
DECLARE
  v_trade RECORD;
  v_payment_time_minutes INT;
  v_confirmation_time_minutes INT;
BEGIN
  -- Get trade details
  SELECT * INTO v_trade
  FROM public.p2p_fiat_trades
  WHERE id = p_trade_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade % not found', p_trade_id;
  END IF;
  
  -- Calculate timing metrics
  IF v_trade.buyer_marked_paid_at IS NOT NULL THEN
    v_payment_time_minutes := EXTRACT(EPOCH FROM (v_trade.buyer_marked_paid_at - v_trade.created_at)) / 60;
  END IF;
  
  IF v_trade.seller_confirmed_at IS NOT NULL AND v_trade.buyer_marked_paid_at IS NOT NULL THEN
    v_confirmation_time_minutes := EXTRACT(EPOCH FROM (v_trade.seller_confirmed_at - v_trade.buyer_marked_paid_at)) / 60;
  END IF;
  
  -- Update seller reputation
  INSERT INTO public.p2p_reputation (
    user_id,
    total_trades,
    completed_trades,
    total_as_seller,
    reputation_score,
    avg_confirmation_time_minutes,
    last_trade_at,
    first_trade_at
  ) VALUES (
    p_seller_id,
    1,
    1,
    1,
    105, -- +5 bonus for first trade
    v_confirmation_time_minutes,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_trades = p2p_reputation.total_trades + 1,
    completed_trades = p2p_reputation.completed_trades + 1,
    total_as_seller = p2p_reputation.total_as_seller + 1,
    reputation_score = LEAST(p2p_reputation.reputation_score + 5, 1000),
    avg_confirmation_time_minutes = CASE
      WHEN p2p_reputation.avg_confirmation_time_minutes IS NULL THEN v_confirmation_time_minutes
      ELSE (p2p_reputation.avg_confirmation_time_minutes + COALESCE(v_confirmation_time_minutes, 0)) / 2
    END,
    last_trade_at = NOW(),
    updated_at = NOW();
  
  -- Update buyer reputation
  INSERT INTO public.p2p_reputation (
    user_id,
    total_trades,
    completed_trades,
    total_as_buyer,
    reputation_score,
    avg_payment_time_minutes,
    last_trade_at,
    first_trade_at
  ) VALUES (
    p_buyer_id,
    1,
    1,
    1,
    105,
    v_payment_time_minutes,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_trades = p2p_reputation.total_trades + 1,
    completed_trades = p2p_reputation.completed_trades + 1,
    total_as_buyer = p2p_reputation.total_as_buyer + 1,
    reputation_score = LEAST(p2p_reputation.reputation_score + 5, 1000),
    avg_payment_time_minutes = CASE
      WHEN p2p_reputation.avg_payment_time_minutes IS NULL THEN v_payment_time_minutes
      ELSE (p2p_reputation.avg_payment_time_minutes + COALESCE(v_payment_time_minutes, 0)) / 2
    END,
    last_trade_at = NOW(),
    updated_at = NOW();
  
  -- Update trust levels based on reputation score
  UPDATE public.p2p_reputation
  SET trust_level = CASE
    WHEN reputation_score >= 900 THEN 'verified'
    WHEN reputation_score >= 700 THEN 'advanced'
    WHEN reputation_score >= 400 THEN 'intermediate'
    WHEN reputation_score >= 100 THEN 'basic'
    ELSE 'new'
  END,
  fast_trader = CASE
    WHEN avg_payment_time_minutes < 15 AND avg_confirmation_time_minutes < 30 THEN true
    ELSE false
  END
  WHERE user_id IN (p_seller_id, p_buyer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CANCEL EXPIRED TRADES (Cron job function)
-- =====================================================
CREATE OR REPLACE FUNCTION public.cancel_expired_trades()
RETURNS void AS $$
DECLARE
  v_trade RECORD;
BEGIN
  -- Cancel trades where buyer didn't pay in time
  FOR v_trade IN
    SELECT * FROM public.p2p_fiat_trades
    WHERE status = 'pending'
      AND payment_deadline < NOW()
  LOOP
    -- Update trade status
    UPDATE public.p2p_fiat_trades
    SET 
      status = 'cancelled',
      cancelled_by = seller_id,
      cancellation_reason = 'Payment deadline expired',
      updated_at = NOW()
    WHERE id = v_trade.id;
    
    -- Restore offer remaining amount
    UPDATE public.p2p_fiat_offers
    SET 
      remaining_amount = remaining_amount + v_trade.crypto_amount,
      status = CASE
        WHEN status = 'locked' THEN 'open'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = v_trade.offer_id;
    
    -- Update reputation (penalty for buyer)
    UPDATE public.p2p_reputation
    SET 
      cancelled_trades = cancelled_trades + 1,
      reputation_score = GREATEST(reputation_score - 10, 0),
      updated_at = NOW()
    WHERE user_id = v_trade.buyer_id;
  END LOOP;
  
  -- Auto-release trades where seller didn't confirm in time
  FOR v_trade IN
    SELECT * FROM public.p2p_fiat_trades
    WHERE status = 'payment_sent'
      AND confirmation_deadline < NOW()
  LOOP
    -- Mark as completed (auto-release)
    UPDATE public.p2p_fiat_trades
    SET 
      seller_confirmed_at = NOW(),
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_trade.id;
    
    -- Note: Actual blockchain release must be done by backend service
    -- This just marks the trade as ready for release
    
    -- Update reputations
    PERFORM public.update_p2p_reputation(v_trade.seller_id, v_trade.buyer_id, v_trade.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CANCEL EXPIRED OFFERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.cancel_expired_offers()
RETURNS void AS $$
BEGIN
  UPDATE public.p2p_fiat_offers
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE status = 'open'
    AND expires_at < NOW();
  
  -- Note: Escrow refunds must be processed by backend service
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET PAYMENT METHOD DETAILS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_payment_method_details(
  p_offer_id UUID,
  p_requesting_user_id UUID
) RETURNS TABLE(
  method_name TEXT,
  payment_details JSONB
) AS $$
DECLARE
  v_offer RECORD;
  v_trade RECORD;
BEGIN
  -- Get offer
  SELECT * INTO v_offer
  FROM public.p2p_fiat_offers
  WHERE id = p_offer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  
  -- Check if user is involved in an active trade for this offer
  SELECT * INTO v_trade
  FROM public.p2p_fiat_trades
  WHERE offer_id = p_offer_id
    AND buyer_id = p_requesting_user_id
    AND status IN ('pending', 'payment_sent')
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: You must have an active trade to view payment details';
  END IF;
  
  -- Return decrypted payment details
  RETURN QUERY
  SELECT 
    pm.method_name,
    v_offer.payment_details_encrypted::JSONB -- TODO: Decrypt
  FROM public.payment_methods pm
  WHERE pm.id = v_offer.payment_method_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.increment_escrow_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_escrow_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_p2p_reputation TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_expired_trades TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_expired_offers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_method_details TO authenticated;
