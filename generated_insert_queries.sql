-- =====================================================
-- GENERATED SQL QUERIES FOR INVESTMENT UPLOAD
-- =====================================================
-- Generated on: 2025-11-06 18:44:27
-- Total investments: 27
-- Total investment amount: ₹20,000,000.00
-- =====================================================

BEGIN;

-- Step 0: Create New Pool
-- =====================================================

-- Create new pool: Anilsiva Pool
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
    'Anilsiva Pool',
    'Pool for Anilsiva company investments',
    ARRAY['Anilsiva'],
    ARRAY[]::TEXT[],
    '2024-07-11'::DATE,
    66666666.66666667,
    46666666.66666667,
    20000000.0,
    0,
    0,
    0,
    0,
    0,
    'Active'
)
;

-- Step 1: Insert/Update Investors
-- =====================================================

-- Investor 1: Saanwra Khod

-- Investor: Saanwra Khod
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Saanwra Khod', 'saanwra5090@gmail.com', '8011036466', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 2: Bukke Siva Prasad Naik

-- Investor: Bukke Siva Prasad Naik
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Bukke Siva Prasad Naik', 'bspn96@gmail.com', '9000272020', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 3: Yerra Sunitha Reddy

-- Investor: Yerra Sunitha Reddy
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Yerra Sunitha Reddy', 'pramodreddy620@gmail.com', '9435686035', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 4: Sai Krishna

-- Investor: Sai Krishna
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Sai Krishna', 'skntradersxroad@gmail.com', '6300728778', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 5: Aditya Somavajhala

-- Investor: Aditya Somavajhala
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Aditya Somavajhala', 'adityacharans210@gmail.com', '8802643419', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 6: Veera Naga Siva Kumar Samatham

-- Investor: Veera Naga Siva Kumar Samatham
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Veera Naga Siva Kumar Samatham', 'k.samatham3157@gmail.com', '7169079194', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 7: Nikhil Mungara

-- Investor: Nikhil Mungara
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Nikhil Mungara', 'mungaranikhil@gmail.com', '9802675044', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 8: Nandalal A

-- Investor: Nandalal A
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Nandalal A', 'nandalal.are@gmail.com', '8686888626', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 9: Minchala Prabhu Kanthi

-- Investor: Minchala Prabhu Kanthi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Minchala Prabhu Kanthi', 'rupeshminchala1996@gmail.com', '8011991390', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 10: Madhu

-- Investor: Madhu
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Madhu', 'ankitchahar11@gmail.com', '8011491811', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 11: Suchita Rajkumar Pardhi

-- Investor: Suchita Rajkumar Pardhi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Suchita Rajkumar Pardhi', 'umangpardhi@gmail.com', '9085750182', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 12: Bhargav Y S

-- Investor: Bhargav Y S
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Bhargav Y S', 'ysbhargav123@gmail.com', '8811093811', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 13: Suriti Khod

-- Investor: Suriti Khod
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Suriti Khod', 'suritikhod@gmail.com', '7909500000', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 14: Mukkoti Anil

-- Investor: Mukkoti Anil
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Mukkoti Anil', 'anilmukkoti@gmail.com', '7989593980', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 15: D Suraj Sai

-- Investor: D Suraj Sai
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('D Suraj Sai', 'dabbirusaisuraj@gmail.com', '7896890396', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 16: Mukkoti Madan Mohan 

-- Investor: Mukkoti Madan Mohan 
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Mukkoti Madan Mohan', 'madan22@yahoo.com', '9042101639', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 17: Mukkoti Kalpana 

-- Investor: Mukkoti Kalpana 
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Mukkoti Kalpana', 'bkalpana@gmail.com', '3092783651', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 18: Mukkoti Nirmala

-- Investor: Mukkoti Nirmala
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Mukkoti Nirmala', 'ktallapally@gmail.com', '6789384818', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 19: Mukkoti Hemalatha

-- Investor: Mukkoti Hemalatha
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Mukkoti Hemalatha', 'hema_mukkoti@yahoo.com', '4085719327', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 20: Saket Agrawal

-- Investor: Saket Agrawal
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Saket Agrawal', 'saketagrawal780@gmail.com', '7972245641', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 21: Abhishek Kumar

-- Investor: Abhishek Kumar
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Abhishek Kumar', 'abhishek.tnpd@gmail.com', '9430941922', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 22: Nayanjyoti Kakati

-- Investor: Nayanjyoti Kakati
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Nayanjyoti Kakati', 'nayanjyotikakati1997@gmail.com', '7086858651', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 23: Meet Patoliya

-- Investor: Meet Patoliya
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Meet Patoliya', 'patoliyameet439@gmail.com', '9409076890', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 24: Babita Tyagi

-- Investor: Babita Tyagi
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Babita Tyagi', 'tyagiabhishek13@gmail.com', '9192014812', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 25: Kuladeep Reddy

-- Investor: Kuladeep Reddy
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Kuladeep Reddy', 'bkuladeepreddy@gmail.com', '9440177813', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;

-- Investor 26: Mol Villiamkuzhil Paulose

-- Investor: Mol Villiamkuzhil Paulose
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ('Mol Villiamkuzhil Paulose', 'mevin713@gmail.com', '9819277538', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone)
RETURNING investor_id;


-- Step 2: Insert Investments
-- =====================================================

-- Investment 1: Saanwra Khod - ₹8,00,000

-- Investment: Saanwra Khod - ₹8,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    800000.0,
    4.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'saanwra5090@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 2: Bukke Siva Prasad Naik - ₹8,00,000

-- Investment: Bukke Siva Prasad Naik - ₹8,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    800000.0,
    4.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'bspn96@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 3: Yerra Sunitha Reddy - ₹5,00,000

-- Investment: Yerra Sunitha Reddy - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'pramodreddy620@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 4: Sai Krishna - ₹21,00,000

-- Investment: Sai Krishna - ₹21,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    2100000.0,
    10.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'skntradersxroad@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 5: Aditya Somavajhala - ₹5,00,000

-- Investment: Aditya Somavajhala - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'adityacharans210@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 6: Veera Naga Siva Kumar Samatham - ₹15,00,000

-- Investment: Veera Naga Siva Kumar Samatham - ₹15,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1500000.0,
    7.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'k.samatham3157@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 7: Nikhil Mungara - ₹3,00,000

-- Investment: Nikhil Mungara - ₹3,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    300000.0,
    1.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'mungaranikhil@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 8: Nandalal A - ₹5,00,000

-- Investment: Nandalal A - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'nandalal.are@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 9: Minchala Prabhu Kanthi - ₹5,00,000

-- Investment: Minchala Prabhu Kanthi - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'rupeshminchala1996@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 10: Madhu - ₹3,00,000

-- Investment: Madhu - ₹3,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    300000.0,
    1.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'ankitchahar11@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 11: Suchita Rajkumar Pardhi - ₹2,00,000

-- Investment: Suchita Rajkumar Pardhi - ₹2,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    200000.0,
    1.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'umangpardhi@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 12: Bhargav Y S - ₹5,00,000

-- Investment: Bhargav Y S - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'ysbhargav123@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 13: Suriti Khod - ₹10,00,000

-- Investment: Suriti Khod - ₹10,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    5.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'suritikhod@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 14: Mukkoti Anil - ₹5,00,000

-- Investment: Mukkoti Anil - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'anilmukkoti@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 15: D Suraj Sai - ₹5,00,000

-- Investment: D Suraj Sai - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'dabbirusaisuraj@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 16: Mukkoti Madan Mohan  - ₹10,00,000

-- Investment: Mukkoti Madan Mohan  - ₹10,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    5.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'madan22@yahoo.com'
ON CONFLICT DO NOTHING;

-- Investment 17: Mukkoti Kalpana  - ₹10,00,000

-- Investment: Mukkoti Kalpana  - ₹10,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    5.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'bkalpana@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 18: Mukkoti Nirmala - ₹10,00,000

-- Investment: Mukkoti Nirmala - ₹10,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    5.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'ktallapally@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 19: Mukkoti Hemalatha - ₹10,00,000

-- Investment: Mukkoti Hemalatha - ₹10,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    5.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'hema_mukkoti@yahoo.com'
ON CONFLICT DO NOTHING;

-- Investment 20: Saket Agrawal - ₹5,00,000

-- Investment: Saket Agrawal - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'saketagrawal780@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 21: Abhishek Kumar - ₹10,00,000

-- Investment: Abhishek Kumar - ₹10,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    1000000.0,
    5.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'abhishek.tnpd@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 22: Nayanjyoti Kakati - ₹5,00,000

-- Investment: Nayanjyoti Kakati - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'nayanjyotikakati1997@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 23: Meet Patoliya - ₹5,00,000

-- Investment: Meet Patoliya - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'patoliyameet439@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 24: Babita Tyagi - ₹20,00,000

-- Investment: Babita Tyagi - ₹20,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    2000000.0,
    10.0000,
    '2024-07-11 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'tyagiabhishek13@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 25: Kuladeep Reddy - ₹5,00,000

-- Investment: Kuladeep Reddy - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-08-31 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'bkuladeepreddy@gmail.com'
ON CONFLICT DO NOTHING;

-- Investment 26: Mol Villiamkuzhil Paulose - ₹5,00,000

-- Investment: Mol Villiamkuzhil Paulose - ₹5,00,000
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    (SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Anilsiva Pool' ORDER BY created_at DESC LIMIT 1),
    500000.0,
    2.5000,
    '2024-11-18 00:00:00+00'::TIMESTAMPTZ
FROM public.investors i
WHERE i.email = 'mevin713@gmail.com'
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- END OF GENERATED QUERIES
-- =====================================================
