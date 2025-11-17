-- =====================================================
-- PAYMENT METHODS DATA - PRODUCTION
-- =====================================================

INSERT INTO public.payment_methods (currency, country, method_name, method_type, fields, validation_rules, min_trade_amount, max_trade_amount, processing_time_minutes, display_order) VALUES

-- ========== TURKEY (TRY) ==========
('TRY', 'TR', 'Ziraat Bankası', 'bank', 
  '{"iban": "", "account_holder": "", "branch_code": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 1),

('TRY', 'TR', 'İş Bankası', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 2),

('TRY', 'TR', 'Garanti BBVA', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 3),

('TRY', 'TR', 'Yapı Kredi', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 4),

('TRY', 'TR', 'Akbank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 5),

('TRY', 'TR', 'Halkbank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 6),

('TRY', 'TR', 'Vakıfbank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 7),

('TRY', 'TR', 'QNB Finansbank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 8),

('TRY', 'TR', 'TEB', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 9),

('TRY', 'TR', 'Denizbank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 30, 10),

('TRY', 'TR', 'Papara', 'mobile_payment',
  '{"papara_number": "", "full_name": ""}',
  '{"papara_number": {"pattern": "^[0-9]{10}$", "required": true}}',
  50, 50000, 5, 11),

('TRY', 'TR', 'Paybol', 'mobile_payment',
  '{"phone_number": "", "full_name": ""}',
  '{"phone_number": {"pattern": "^\\+90[0-9]{10}$", "required": true}}',
  50, 50000, 10, 12),

('TRY', 'TR', 'FAST (Hızlı Transfer)', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^TR[0-9]{24}$", "required": true}}',
  100, 100000, 15, 13),

-- ========== IRAQ (IQD) ==========
('IQD', 'IQ', 'Rasheed Bank', 'bank',
  '{"account_number": "", "account_holder": "", "branch": ""}',
  '{"account_number": {"minLength": 10, "required": true}}',
  50000, 50000000, 60, 1),

('IQD', 'IQ', 'Rafidain Bank', 'bank',
  '{"account_number": "", "account_holder": "", "branch": ""}',
  '{"account_number": {"minLength": 10, "required": true}}',
  50000, 50000000, 60, 2),

('IQD', 'IQ', 'Trade Bank of Iraq (TBI)', 'bank',
  '{"account_number": "", "account_holder": "", "swift_code": ""}',
  '{"account_number": {"minLength": 10, "required": true}}',
  50000, 50000000, 60, 3),

('IQD', 'IQ', 'Kurdistan International Bank', 'bank',
  '{"account_number": "", "account_holder": "", "branch": ""}',
  '{"account_number": {"minLength": 10, "required": true}}',
  50000, 50000000, 60, 4),

('IQD', 'IQ', 'Cihan Bank', 'bank',
  '{"account_number": "", "account_holder": ""}',
  '{"account_number": {"minLength": 10, "required": true}}',
  50000, 50000000, 60, 5),

('IQD', 'IQ', 'Fast Pay', 'mobile_payment',
  '{"fast_pay_id": "", "phone_number": "", "full_name": ""}',
  '{"fast_pay_id": {"minLength": 6, "required": true}}',
  10000, 20000000, 15, 6),

('IQD', 'IQ', 'Zain Cash', 'mobile_payment',
  '{"zain_number": "", "full_name": ""}',
  '{"zain_number": {"pattern": "^07[0-9]{9}$", "required": true}}',
  10000, 20000000, 15, 7),

('IQD', 'IQ', 'Asia Hawala', 'mobile_payment',
  '{"hawala_code": "", "phone_number": "", "full_name": ""}',
  '{"hawala_code": {"minLength": 8, "required": true}}',
  50000, 30000000, 30, 8),

('IQD', 'IQ', 'Korek Money Transfer', 'mobile_payment',
  '{"korek_number": "", "full_name": ""}',
  '{"korek_number": {"pattern": "^04[0-9]{8}$", "required": true}}',
  10000, 20000000, 15, 9),

('IQD', 'IQ', 'Qi Card', 'mobile_payment',
  '{"qi_card_number": "", "full_name": ""}',
  '{"qi_card_number": {"minLength": 16, "maxLength": 19, "required": true}}',
  10000, 20000000, 15, 10),

-- ========== IRAN (IRR) ==========
('IRR', 'IR', 'Bank Mellat', 'bank',
  '{"card_number": "", "account_holder": "", "sheba": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  1000000, 500000000, 60, 1),

('IRR', 'IR', 'Bank Melli Iran', 'bank',
  '{"card_number": "", "account_holder": "", "sheba": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  1000000, 500000000, 60, 2),

('IRR', 'IR', 'Bank Saderat', 'bank',
  '{"card_number": "", "account_holder": "", "sheba": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  1000000, 500000000, 60, 3),

('IRR', 'IR', 'Bank Tejarat', 'bank',
  '{"card_number": "", "account_holder": "", "sheba": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  1000000, 500000000, 60, 4),

('IRR', 'IR', 'Pasargad Bank', 'bank',
  '{"card_number": "", "account_holder": "", "sheba": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  1000000, 500000000, 60, 5),

('IRR', 'IR', 'Bank Keshavarzi', 'bank',
  '{"card_number": "", "account_holder": "", "sheba": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  1000000, 500000000, 60, 6),

('IRR', 'IR', 'Shetab Card Transfer', 'mobile_payment',
  '{"card_number": "", "full_name": ""}',
  '{"card_number": {"pattern": "^[0-9]{16}$", "required": true}}',
  500000, 300000000, 10, 7),

-- ========== EUROPE (EUR) ==========
('EUR', 'EU', 'SEPA Bank Transfer', 'bank',
  '{"iban": "", "bic_swift": "", "account_holder": "", "bank_name": ""}',
  '{"iban": {"pattern": "^[A-Z]{2}[0-9]{2}[A-Z0-9]+$", "required": true}}',
  50, 50000, 120, 1),

('EUR', 'EU', 'Wise (TransferWise)', 'mobile_payment',
  '{"wise_email": "", "full_name": ""}',
  '{"wise_email": {"pattern": "^[^@]+@[^@]+\\.[^@]+$", "required": true}}',
  20, 20000, 30, 2),

('EUR', 'EU', 'Revolut', 'mobile_payment',
  '{"revolut_tag": "", "full_name": ""}',
  '{"revolut_tag": {"pattern": "^@[a-zA-Z0-9_]+$", "required": true}}',
  20, 20000, 15, 3),

('EUR', 'EU', 'N26', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^DE[0-9]{20}$", "required": true}}',
  50, 50000, 60, 4),

('EUR', 'EU', 'PayPal', 'mobile_payment',
  '{"paypal_email": ""}',
  '{"paypal_email": {"pattern": "^[^@]+@[^@]+\\.[^@]+$", "required": true}}',
  10, 10000, 30, 5),

('EUR', 'DE', 'Deutsche Bank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^DE[0-9]{20}$", "required": true}}',
  50, 50000, 60, 6),

('EUR', 'FR', 'BNP Paribas', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^FR[0-9]{25}$", "required": true}}',
  50, 50000, 60, 7),

('EUR', 'NL', 'ING Bank', 'bank',
  '{"iban": "", "account_holder": ""}',
  '{"iban": {"pattern": "^NL[0-9]{16}$", "required": true}}',
  50, 50000, 60, 8),

-- ========== UNITED STATES (USD) ==========
('USD', 'US', 'Bank of America', 'bank',
  '{"account_number": "", "routing_number": "", "account_holder": "", "account_type": ""}',
  '{"account_number": {"minLength": 8, "required": true}, "routing_number": {"pattern": "^[0-9]{9}$", "required": true}}',
  100, 50000, 180, 1),

('USD', 'US', 'Chase Bank', 'bank',
  '{"account_number": "", "routing_number": "", "account_holder": ""}',
  '{"account_number": {"minLength": 8, "required": true}, "routing_number": {"pattern": "^[0-9]{9}$", "required": true}}',
  100, 50000, 180, 2),

('USD', 'US', 'Wells Fargo', 'bank',
  '{"account_number": "", "routing_number": "", "account_holder": ""}',
  '{"account_number": {"minLength": 8, "required": true}, "routing_number": {"pattern": "^[0-9]{9}$", "required": true}}',
  100, 50000, 180, 3),

('USD', 'US', 'Zelle', 'mobile_payment',
  '{"zelle_email_or_phone": "", "full_name": ""}',
  '{"zelle_email_or_phone": {"minLength": 5, "required": true}}',
  50, 20000, 15, 4),

('USD', 'US', 'Venmo', 'mobile_payment',
  '{"venmo_username": "", "full_name": ""}',
  '{"venmo_username": {"pattern": "^@[a-zA-Z0-9_-]+$", "required": true}}',
  10, 5000, 15, 5),

('USD', 'US', 'Cash App', 'mobile_payment',
  '{"cashtag": "", "full_name": ""}',
  '{"cashtag": {"pattern": "^\\$[a-zA-Z0-9]+$", "required": true}}',
  10, 5000, 15, 6),

('USD', 'US', 'PayPal', 'mobile_payment',
  '{"paypal_email": ""}',
  '{"paypal_email": {"pattern": "^[^@]+@[^@]+\\.[^@]+$", "required": true}}',
  10, 10000, 30, 7),

('USD', 'US', 'Wise (USD)', 'mobile_payment',
  '{"wise_email": "", "full_name": ""}',
  '{"wise_email": {"pattern": "^[^@]+@[^@]+\\.[^@]+$", "required": true}}',
  20, 20000, 30, 8),

('USD', 'US', 'Western Union', 'cash',
  '{"mtcn": "", "receiver_name": "", "receiver_country": ""}',
  '{"mtcn": {"pattern": "^[0-9]{10}$", "required": true}}',
  50, 10000, 60, 9);

-- Initialize escrow balance
INSERT INTO public.platform_escrow_balance (token, total_locked, hot_wallet_address, last_audit_at) VALUES
('HEZ', 0, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', NOW()),
('PEZ', 0, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', NOW());
