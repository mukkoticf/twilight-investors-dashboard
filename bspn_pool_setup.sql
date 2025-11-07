-- =====================================================
-- BSPN POOL - INITIAL SETUP
-- =====================================================
-- This script creates the BSPN Pool for BSPN company investments
-- Note: Update the investment amounts and dates based on your actual data
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create BSPN Pool
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
    'BSPN Pool',
    'Pool for BSPN company investments',
    ARRAY['BSPN'],
    ARRAY[]::TEXT[],
    '2024-09-05'::DATE,  -- Update with actual purchase date
    0,                    -- Update with actual total cost
    0,                    -- Update with actual bank loan amount
    0,                    -- Update with actual investor amount (will be calculated from investments)
    0,                    -- Update with actual monthly EMI
    0,                    -- Update with actual emergency fund collected
    0,                    -- Update with actual company share
    0,                    -- Update with actual investor share
    0,                    -- Update with actual remaining emergency fund
    'Active'
)
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the pool was created
SELECT 
    purchase_id,
    pool_name,
    description,
    owner_names,
    purchase_date,
    investor_amount,
    status
FROM public.company_pools
WHERE pool_name = 'BSPN Pool'
ORDER BY created_at DESC;

-- =====================================================
-- END OF SCRIPT
-- =====================================================

