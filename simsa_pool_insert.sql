-- =====================================================
-- SIMSA POOL - COMPLETE DATA INSERTION
-- =====================================================
-- Generated from: SIMSA Investment Receipts - Investment receipts.csv
-- Total investments: 11
-- Total investment amount: ₹1,50,00,000
-- Purchase date: 5 September 2024
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 0: Create SIMSA Pool
-- =====================================================

INSERT INTO public.company_pools (
    pool_name,
    description,
    owner_names,
    vehicle_numbers,
    purchase_date,
    total_cost,
    bank_loan_amount,
    investor_amount,
    monthly_emi,
    emergency_fund_collected,
    emergency_fund_company_share,
    emergency_fund_investor_share,
    emergency_fund_remaining,
    status
)
VALUES (
    'SIMSA Pool',
    'Pool for SIMSA company investments',
    ARRAY['SIMSA'],
    ARRAY[]::TEXT[],
    '2024-09-05'::DATE,
    0,
    0,
    15000000.0,
    0,
    0,
    0,
    0,
    0,
    'Active'
);

-- =====================================================
-- STEP 1: Insert/Update Investors
-- =====================================================

-- Investor 1: Saanwra Khod
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Saanwra Khod', 'saanwra5090@gmail.com', '8011036466', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 2: Rukmini Chitirala
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Rukmini Chitirala', 'gopichand.chitirala@gmail.com', '7989979494', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 3: Porika Likhith Raj
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Porika Likhith Raj', 'likhith.raj1797@gmail.com', '8011494190', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 4: Rajiv Reddy Adireddygari
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Rajiv Reddy Adireddygari', 'rajivreddya855@gmail.com', '3413457715', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 5: Yeraguntla Sumanth
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Yeraguntla Sumanth', 'sumanthyerraguntla@gmail.com', '9014099604', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 6: K.Veda Sai Vamshi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('K.Veda Sai Vamshi', 'vamshi.kvs59@gmail.com', '8978940683', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 7: Chinta Nirmaladevi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Chinta Nirmaladevi', 'nimmi1227@gmail.com', '8088282290', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 8: V Muthu Lakshmi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('V Muthu Lakshmi', 'vasanthkumar753@gmail.com', '9247651427', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 9: Jyothi Bodepudi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Jyothi Bodepudi', 'jyothisadineni@gmail.com', '9885476584', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 10: Sammeta Vasantha Shobha Rani
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Sammeta Vasantha Shobha Rani', 'svshobha7@gmail.com', '7013302596', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- Investor 11: Sai Krishna (may already exist from Anilsiva pool)
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Sai Krishna', 'skntradersxroad@gmail.com', '6300728778', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW();

-- =====================================================
-- STEP 2: Insert Investments
-- =====================================================

-- Investment 1: Saanwra Khod - ₹32,00,000 (21.33%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    3200000.0,
    21.3333,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'saanwra5090@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 2: Rukmini Chitirala - ₹25,00,000 (16.67%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    2500000.0,
    16.6667,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'gopichand.chitirala@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 3: Porika Likhith Raj - ₹5,00,000 (3.33%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    3.3333,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'likhith.raj1797@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 4: Rajiv Reddy Adireddygari - ₹13,00,000 (8.67%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    1300000.0,
    8.6667,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'rajivreddya855@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 5: Yeraguntla Sumanth - ₹20,00,000 (13.33%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    2000000.0,
    13.3333,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'sumanthyerraguntla@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 6: K.Veda Sai Vamshi - ₹5,00,000 (3.33%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    3.3333,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'vamshi.kvs59@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 7: Chinta Nirmaladevi - ₹10,00,000 (6.67%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    6.6667,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'nimmi1227@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 8: V Muthu Lakshmi - ₹5,00,000 (3.33%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    3.3333,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'vasanthkumar753@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 9: Jyothi Bodepudi - ₹15,00,000 (10.00%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    1500000.0,
    10.0000,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'jyothisadineni@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 10: Sammeta Vasantha Shobha Rani - ₹5,00,000 (3.33%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    3.3333,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'svshobha7@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 11: Sai Krishna - ₹15,00,000 (10.00%)
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'SIMSA Pool' ORDER BY created_at DESC LIMIT 1),
    1500000.0,
    10.0000,
    '2024-09-05 00:00:00+00'
FROM public.investors i
WHERE i.email = 'skntradersxroad@gmail.com'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Update Bank Account Numbers
-- =====================================================

-- Update bank account numbers based on Receiver Account Number from CSV
UPDATE public.investors
SET bank_account_no = '50100553210952',
    updated_at = NOW()
WHERE email = 'saanwra5090@gmail.com'
  AND (bank_account_no IS NULL OR bank_account_no != '50100553210952');

-- Note: Other investors' bank accounts are receiver accounts, not their own
-- Update only if the investor is also the receiver
UPDATE public.investors
SET bank_account_no = '50100591409656',
    updated_at = NOW()
WHERE email = 'bspn96@gmail.com'
  AND (bank_account_no IS NULL OR bank_account_no != '50100591409656');

UPDATE public.investors
SET bank_account_no = '919010027937741',
    updated_at = NOW()
WHERE email = 'anilmukkoti@gmail.com'
  AND (bank_account_no IS NULL OR bank_account_no != '919010027937741');

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify pool was created
SELECT 
    purchase_id,
    pool_name,
    investor_amount,
    purchase_date,
    status
FROM public.company_pools
WHERE pool_name = 'SIMSA Pool'
ORDER BY created_at DESC
LIMIT 1;

-- Verify investors were inserted/updated
SELECT 
    investor_id,
    investor_name,
    email,
    phone,
    bank_account_no
FROM public.investors
WHERE email IN (
    'saanwra5090@gmail.com',
    'gopichand.chitirala@gmail.com',
    'likhith.raj1797@gmail.com',
    'rajivreddya855@gmail.com',
    'sumanthyerraguntla@gmail.com',
    'vamshi.kvs59@gmail.com',
    'nimmi1227@gmail.com',
    'vasanthkumar753@gmail.com',
    'jyothisadineni@gmail.com',
    'svshobha7@gmail.com',
    'skntradersxroad@gmail.com'
)
ORDER BY investor_name;

-- Verify investments were inserted
SELECT 
    ii.investment_id,
    i.investor_name,
    i.email,
    ii.investment_amount,
    ii.investment_percentage,
    cp.pool_name,
    ii.created_at
FROM public.investor_investments ii
JOIN public.investors i ON ii.investor_id = i.investor_id
JOIN public.company_pools cp ON ii.purchase_id = cp.purchase_id
WHERE cp.pool_name = 'SIMSA Pool'
ORDER BY ii.investment_amount DESC;

-- =====================================================
-- END OF SCRIPT
-- =====================================================

