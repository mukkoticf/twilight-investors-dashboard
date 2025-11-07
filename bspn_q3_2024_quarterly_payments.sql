-- =====================================================
-- BSPN POOL - Q3 (OND) 2024 QUARTERLY PAYMENTS
-- =====================================================
-- Generated from: SIMSA Investment Receipts - BSPN payout Receipts Q3 (OND) 2024.csv
-- Quarter: Q3-2024 (October-November-December 2024)
-- Declaration Date: 2024-12-31 (end of quarter)
-- Total Gross ROI: ₹8,28,315
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create Quarterly ROI Declaration for BSPN Pool
-- =====================================================

-- ROI Percentage Calculation (from CSV totals):
-- Total Gross ROI from CSV: ₹8,28,315 = 828315
-- Note: Total investment amount needs to be updated based on actual BSPN Pool investments
-- ROI Percentage will be calculated once total investment is known
-- For now, using estimated percentage - UPDATE THIS based on actual pool investment amount

INSERT INTO public.quarterly_roi_declarations (
    quarter_year,
    roi_percentage,
    declaration_date,
    purchase_id,
    is_finalized
)
SELECT 
    'Q3-2024',
    6.00,  -- UPDATE THIS: Calculate as (828315 / total_investment) * 100
    '2024-12-31'::DATE,
    cp.purchase_id,
    true
FROM public.company_pools cp
WHERE cp.pool_name = 'BSPN Pool'
ORDER BY cp.created_at DESC
LIMIT 1
ON CONFLICT (quarter_year, purchase_id) DO UPDATE SET
    roi_percentage = EXCLUDED.roi_percentage,
    declaration_date = EXCLUDED.declaration_date,
    is_finalized = EXCLUDED.is_finalized

-- =====================================================
-- STEP 2: Insert Quarterly Payments for Each Investor
-- =====================================================

-- Payment 1: Adireddygari Nandi Reddy
-- Gross ROI: ₹1,54,737 | Pending: ₹88,421 | TDS: ₹15,474 | Net Payable: ₹1,39,263
INSERT INTO public.investor_quarterly_payments (
    investor_id,
    declaration_id,
    gross_roi_amount,
    emergency_fund_deduction,
    tds_deduction,
    net_payable_amount,
    payment_status
)
SELECT 
    i.investor_id,
    qrd.declaration_id,
    154737.0,
    0.0,
    15474.0,
    139263.0,
    'Paid'
FROM public.investors i
CROSS JOIN (
    SELECT declaration_id 
    FROM public.quarterly_roi_declarations qrd
    JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
    WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024'
    ORDER BY qrd.created_at DESC
    LIMIT 1
) qrd
WHERE i.email = 'rajivreddya855@gmail.com'
ON CONFLICT DO NOTHING;

-- Payment 2: V Muthu Lakshmi
-- Gross ROI: ₹22,105 | Pending: ₹12,632 | TDS: ₹2,211 | Net Payable: ₹19,895
INSERT INTO public.investor_quarterly_payments (
    investor_id,
    declaration_id,
    gross_roi_amount,
    emergency_fund_deduction,
    tds_deduction,
    net_payable_amount,
    payment_status
)
SELECT 
    i.investor_id,
    qrd.declaration_id,
    22105.0,
    0.0,
    2211.0,
    19895.0,
    'Paid'
FROM public.investors i
CROSS JOIN (
    SELECT declaration_id 
    FROM public.quarterly_roi_declarations qrd
    JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
    WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024'
    ORDER BY qrd.created_at DESC
    LIMIT 1
) qrd
WHERE i.email = 'vasanthkumar753@gmail.com'
ON CONFLICT DO NOTHING;

-- Payment 3: Mukkoti Anil Kumar
-- Gross ROI: ₹1,54,737 | Pending: ₹88,421 | TDS: ₹15,474 | Net Payable: ₹1,39,263
INSERT INTO public.investor_quarterly_payments (
    investor_id,
    declaration_id,
    gross_roi_amount,
    emergency_fund_deduction,
    tds_deduction,
    net_payable_amount,
    payment_status
)
SELECT 
    i.investor_id,
    qrd.declaration_id,
    154737.0,
    0.0,
    15474.0,
    139263.0,
    'Paid'
FROM public.investors i
CROSS JOIN (
    SELECT declaration_id 
    FROM public.quarterly_roi_declarations qrd
    JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
    WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024'
    ORDER BY qrd.created_at DESC
    LIMIT 1
) qrd
WHERE i.email = 'anilmukkoti@gmail.com'
ON CONFLICT DO NOTHING;

-- Payment 4: K Purna Chandra Rao
-- Gross ROI: ₹1,65,789 | Pending: ₹0 | TDS: ₹16,579 | Net Payable: ₹1,49,211
INSERT INTO public.investor_quarterly_payments (
    investor_id,
    declaration_id,
    gross_roi_amount,
    emergency_fund_deduction,
    tds_deduction,
    net_payable_amount,
    payment_status
)
SELECT 
    i.investor_id,
    qrd.declaration_id,
    165789.0,
    0.0,
    16579.0,
    149211.0,
    'Paid'
FROM public.investors i
CROSS JOIN (
    SELECT declaration_id 
    FROM public.quarterly_roi_declarations qrd
    JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
    WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024'
    ORDER BY qrd.created_at DESC
    LIMIT 1
) qrd
WHERE i.email = 'kattamanchipurna@gmail.com'
ON CONFLICT DO NOTHING;

-- Payment 5: Devathi Jogesh Venkata Surya Prakash
-- Gross ROI: ₹3,31,579 | Pending: ₹1,89,474 | TDS: ₹0 | Net Payable: ₹3,31,579
INSERT INTO public.investor_quarterly_payments (
    investor_id,
    declaration_id,
    gross_roi_amount,
    emergency_fund_deduction,
    tds_deduction,
    net_payable_amount,
    payment_status
)
SELECT 
    i.investor_id,
    qrd.declaration_id,
    331579.0,
    0.0,
    0.0,
    331579.0,
    'Paid'
FROM public.investors i
CROSS JOIN (
    SELECT declaration_id 
    FROM public.quarterly_roi_declarations qrd
    JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
    WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024'
    ORDER BY qrd.created_at DESC
    LIMIT 1
) qrd
WHERE i.email = 'surya.devathi@gmail.com'
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify quarterly declaration was created
SELECT 
    declaration_id,
    quarter_year,
    roi_percentage,
    declaration_date,
    is_finalized,
    cp.pool_name
FROM public.quarterly_roi_declarations qrd
JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024';

-- Verify payments were inserted
SELECT 
    iqp.payment_id,
    i.investor_name,
    i.email,
    iqp.gross_roi_amount,
    iqp.emergency_fund_deduction,
    iqp.tds_deduction,
    iqp.net_payable_amount,
    iqp.payment_status,
    qrd.quarter_year
FROM public.investor_quarterly_payments iqp
JOIN public.investors i ON iqp.investor_id = i.investor_id
JOIN public.quarterly_roi_declarations qrd ON iqp.declaration_id = qrd.declaration_id
JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024'
ORDER BY iqp.gross_roi_amount DESC;

-- Summary totals
SELECT 
    COUNT(*) as total_payments,
    SUM(gross_roi_amount) as total_gross_roi,
    SUM(emergency_fund_deduction) as total_emergency_fund,
    SUM(tds_deduction) as total_tds,
    SUM(net_payable_amount) as total_net_payable
FROM public.investor_quarterly_payments iqp
JOIN public.quarterly_roi_declarations qrd ON iqp.declaration_id = qrd.declaration_id
JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
WHERE cp.pool_name = 'BSPN Pool' AND qrd.quarter_year = 'Q3-2024';

-- =====================================================
-- END OF SCRIPT
-- =====================================================

