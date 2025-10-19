-- =====================================================
-- SQL SCRIPT: CREATE NEW POOL WITH RAHUL AND AKHIL
-- =====================================================
-- This script creates a new investment pool with the same 2 investors (Rahul and Akhil)
-- from the existing "Hybrid Pool", maintaining the same investment amounts and structure.

-- =====================================================
-- STEP 1: CREATE NEW COMPANY POOL
-- =====================================================
-- Creating a new pool with similar structure to the existing "Hybrid Pool"
-- but with different companies and vehicles for variety

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
) VALUES (
    'Premium Pool', 
    'Pool for BSPN and Simsa companies with Rahul and Akhil investments', 
    ARRAY['BSPN', 'Simsa'], 
    ARRAY['KA02CD5678', 'AP39WE7890'], 
    '2025-01-15',
    14000000,  -- ₹1.4 CR total cost
    10000000,  -- ₹100 lakh bank loan
    4000000,   -- ₹40 lakh investor amount (Rahul ₹15L + Akhil ₹25L)
    240000,    -- ₹2.4 lakh monthly EMI
    720000,    -- ₹7.2 lakh emergency fund (18% of investor amount)
    360000,    -- ₹3.6 lakh company share
    360000,    -- ₹3.6 lakh investor share
    360000,    -- ₹3.6 lakh remaining emergency fund
    'Active'
);

-- =====================================================
-- STEP 2: GET INVESTOR IDs FOR RAHUL AND AKHIL
-- =====================================================
-- Note: These queries will help you find the actual UUIDs for Rahul and Akhil
-- Run these queries first to get the actual investor IDs from your database

-- Query to find Rahul's investor_id:
-- SELECT investor_id FROM public.investors WHERE investor_name = 'Rahul';

-- Query to find Akhil's investor_id:
-- SELECT investor_id FROM public.investors WHERE investor_name = 'Akhil';

-- Query to find the new pool's purchase_id:
-- SELECT purchase_id FROM public.company_pools WHERE pool_name = 'Premium Pool';

-- =====================================================
-- STEP 3: RECORD INVESTOR INVESTMENTS IN NEW POOL
-- =====================================================
-- IMPORTANT: Replace the UUIDs below with actual UUIDs from your database
-- Run the queries above first to get the real UUIDs

INSERT INTO public.investor_investments (
    investor_id, 
    purchase_id, 
    investment_amount, 
    investment_percentage
) VALUES 
-- Rahul's investment: ₹15 lakh (37.5% of total ₹40 lakh)
('REPLACE_WITH_RAHUL_INVESTOR_ID', 'REPLACE_WITH_NEW_POOL_PURCHASE_ID', 1500000, 37.5000),
-- Akhil's investment: ₹25 lakh (62.5% of total ₹40 lakh)
('REPLACE_WITH_AKHIL_INVESTOR_ID', 'REPLACE_WITH_NEW_POOL_PURCHASE_ID', 2500000, 62.5000);

-- =====================================================
-- STEP 4: CREATE QUARTERLY ROI DECLARATIONS
-- =====================================================
-- Creating quarterly ROI declarations for the new pool
-- IMPORTANT: Replace 'REPLACE_WITH_NEW_POOL_PURCHASE_ID' with actual purchase_id

-- Q1 2025 Declaration (6% ROI)
INSERT INTO public.quarterly_roi_declarations (
    quarter_year, 
    roi_percentage, 
    declaration_date, 
    purchase_id, 
    is_finalized
) VALUES (
    'Q1-2025', 
    6.00, 
    '2025-03-31', 
    'REPLACE_WITH_NEW_POOL_PURCHASE_ID', 
    true
);

-- Q2 2025 Declaration (8% ROI)
INSERT INTO public.quarterly_roi_declarations (
    quarter_year, 
    roi_percentage, 
    declaration_date, 
    purchase_id, 
    is_finalized
) VALUES (
    'Q2-2025', 
    8.00, 
    '2025-06-30', 
    'REPLACE_WITH_NEW_POOL_PURCHASE_ID', 
    true
);

-- Q3 2025 Declaration (7% ROI)
INSERT INTO public.quarterly_roi_declarations (
    quarter_year, 
    roi_percentage, 
    declaration_date, 
    purchase_id, 
    is_finalized
) VALUES (
    'Q3-2025', 
    7.00, 
    '2025-09-30', 
    'REPLACE_WITH_NEW_POOL_PURCHASE_ID', 
    true
);

-- =====================================================
-- STEP 5: GENERATE QUARTERLY PAYMENTS
-- =====================================================
-- After creating the declarations, run these functions to generate payment records
-- IMPORTANT: Replace declaration IDs with actual UUIDs from the declarations above

-- Generate payments for Q1 2025
-- SELECT generate_quarterly_payments('REPLACE_WITH_Q1_DECLARATION_ID');

-- Generate payments for Q2 2025
-- SELECT generate_quarterly_payments('REPLACE_WITH_Q2_DECLARATION_ID');

-- Generate payments for Q3 2025
-- SELECT generate_quarterly_payments('REPLACE_WITH_Q3_DECLARATION_ID');

-- =====================================================
-- STEP 6: VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the data was inserted correctly

-- Verify the new pool was created
-- SELECT * FROM public.company_pools WHERE pool_name = 'Premium Pool';

-- Verify investor investments
-- SELECT 
--     ii.investment_amount,
--     ii.investment_percentage,
--     i.investor_name,
--     cp.pool_name
-- FROM public.investor_investments ii
-- JOIN public.investors i ON ii.investor_id = i.investor_id
-- JOIN public.company_pools cp ON ii.purchase_id = cp.purchase_id
-- WHERE cp.pool_name = 'Premium Pool';

-- Verify quarterly declarations
-- SELECT * FROM public.quarterly_roi_declarations 
-- WHERE purchase_id = 'REPLACE_WITH_NEW_POOL_PURCHASE_ID';

-- Verify quarterly payments
-- SELECT 
--     iqp.*,
--     i.investor_name,
--     qrd.quarter_year,
--     qrd.roi_percentage
-- FROM public.investor_quarterly_payments iqp
-- JOIN public.investors i ON iqp.investor_id = i.investor_id
-- JOIN public.quarterly_roi_declarations qrd ON iqp.declaration_id = qrd.declaration_id
-- WHERE qrd.purchase_id = 'REPLACE_WITH_NEW_POOL_PURCHASE_ID';

-- =====================================================
-- EXPECTED RESULTS SUMMARY
-- =====================================================
-- New Pool Details:
-- - Pool Name: Premium Pool
-- - Companies: BSPN, Simsa
-- - Vehicles: KA02CD5678, AP39WE7890
-- - Total Cost: ₹1.4 CR
-- - Investor Amount: ₹40 lakh
-- - Monthly EMI: ₹2.4 lakh
-- - Emergency Fund: ₹7.2 lakh

-- Investment Breakdown:
-- - Rahul: ₹15 lakh (37.5%)
-- - Akhil: ₹25 lakh (62.5%)
-- - Total: ₹40 lakh

-- Quarterly ROI Calculations (Example for Q1 2025 - 6% ROI):
-- Rahul: ₹15,00,000 × 6% = ₹90,000 - ₹27,000 (emergency) = ₹63,000 - ₹6,300 (TDS) = ₹56,700
-- Akhil: ₹25,00,000 × 6% = ₹1,50,000 - ₹45,000 (emergency) = ₹1,05,000 - ₹10,500 (TDS) = ₹94,500

-- Emergency Fund per Quarter: ₹90,000 (₹3,60,000 ÷ 4)
-- Rahul's Emergency Share: ₹90,000 × (₹15,00,000 ÷ ₹40,00,000) = ₹33,750
-- Akhil's Emergency Share: ₹90,000 × (₹25,00,000 ÷ ₹40,00,000) = ₹56,250

-- =====================================================
-- INSTRUCTIONS FOR EXECUTION
-- =====================================================
-- 1. First, run the queries in STEP 2 to get actual UUIDs
-- 2. Replace all 'REPLACE_WITH_*' placeholders with actual UUIDs
-- 3. Execute the INSERT statements in order
-- 4. Run the generate_quarterly_payments functions
-- 5. Use the verification queries to confirm everything worked
-- =====================================================
