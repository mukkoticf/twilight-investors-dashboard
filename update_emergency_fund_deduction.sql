-- =====================================================
-- UPDATE EMERGENCY FUND DEDUCTION LOGIC
-- =====================================================
-- This script updates the system to allow manual emergency fund deduction
-- per ROI declaration instead of automatic Q1-Q4 deduction

-- =====================================================
-- STEP 1: Add emergency_fund_deduction_amount column to quarterly_roi_declarations
-- =====================================================
ALTER TABLE public.quarterly_roi_declarations 
ADD COLUMN IF NOT EXISTS emergency_fund_deduction_amount DECIMAL(15,2) NULL;

-- =====================================================
-- STEP 2: Update calculate_quarterly_roi function
-- =====================================================
-- This function now uses the emergency_fund_deduction_amount from the declaration
-- and distributes it proportionally among investors

CREATE OR REPLACE FUNCTION calculate_quarterly_roi(
    p_investor_id UUID,
    p_declaration_id UUID
) RETURNS TABLE (
    gross_roi DECIMAL,
    emergency_fund_deduction DECIMAL,
    tds_deduction DECIMAL,
    net_payable DECIMAL
) AS $$
DECLARE
    v_total_investment DECIMAL;
    v_roi_percentage DECIMAL;
    v_gross_roi DECIMAL;
    v_emergency_fund_deduction DECIMAL;
    v_after_emergency DECIMAL;
    v_tds_deduction DECIMAL;
    v_net_payable DECIMAL;
    v_total_pool_investment DECIMAL;
    v_investor_share DECIMAL;
    v_declaration_emergency_fund DECIMAL;
BEGIN
    -- Get investment amount for THIS SPECIFIC POOL only
    SELECT ii.investment_amount
    INTO v_total_investment
    FROM investor_investments ii
    JOIN quarterly_roi_declarations qrd ON ii.purchase_id = qrd.purchase_id
    WHERE ii.investor_id = p_investor_id
    AND qrd.declaration_id = p_declaration_id;
    
    -- Get ROI percentage and emergency fund amount for this quarter
    SELECT roi_percentage, COALESCE(emergency_fund_deduction_amount, 0)
    INTO v_roi_percentage, v_declaration_emergency_fund
    FROM quarterly_roi_declarations
    WHERE declaration_id = p_declaration_id;
    
    -- Calculate gross ROI
    v_gross_roi := v_total_investment * (v_roi_percentage / 100);
    
    -- Calculate emergency fund deduction if provided in declaration
    IF v_declaration_emergency_fund > 0 THEN
        -- Get total investment amount for the pool
        SELECT COALESCE(SUM(ii.investment_amount), 0)
        INTO v_total_pool_investment
        FROM investor_investments ii
        JOIN quarterly_roi_declarations qrd ON ii.purchase_id = qrd.purchase_id
        WHERE qrd.declaration_id = p_declaration_id;
        
        -- Calculate investor's share of emergency fund based on their investment percentage
        IF v_total_pool_investment > 0 THEN
            v_investor_share := (v_total_investment / v_total_pool_investment);
            v_emergency_fund_deduction := v_declaration_emergency_fund * v_investor_share;
        ELSE
            v_emergency_fund_deduction := 0;
        END IF;
    ELSE
        -- No emergency fund deduction if not specified in declaration
        v_emergency_fund_deduction := 0;
    END IF;
    
    -- Calculate amount after emergency fund deduction
    v_after_emergency := v_gross_roi - COALESCE(v_emergency_fund_deduction, 0);
    
    -- Calculate TDS (10% of amount after emergency fund deduction)
    v_tds_deduction := v_after_emergency * 0.10;
    
    -- Calculate net payable
    v_net_payable := v_after_emergency - v_tds_deduction;
    
    RETURN QUERY SELECT v_gross_roi, COALESCE(v_emergency_fund_deduction, 0), v_tds_deduction, v_net_payable;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Update generate_quarterly_payments function
-- =====================================================
-- This function now also updates emergency_fund_remaining in company_pools
-- when emergency fund is deducted

CREATE OR REPLACE FUNCTION generate_quarterly_payments(
    p_declaration_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_investor RECORD;
    v_calculation RECORD;
    v_payment_id UUID;
    v_count INTEGER := 0;
    v_purchase_id UUID;
    v_emergency_fund_amount DECIMAL;
BEGIN
    -- Get purchase_id and emergency_fund_deduction_amount for this declaration
    SELECT purchase_id, COALESCE(emergency_fund_deduction_amount, 0)
    INTO v_purchase_id, v_emergency_fund_amount
    FROM quarterly_roi_declarations
    WHERE declaration_id = p_declaration_id;
    
    -- Loop through all investors with investments in this pool
    FOR v_investor IN
        SELECT DISTINCT ii.investor_id
        FROM investor_investments ii
        WHERE ii.purchase_id = v_purchase_id
    LOOP
        -- Calculate ROI for this investor
        SELECT * INTO v_calculation
        FROM calculate_quarterly_roi(v_investor.investor_id, p_declaration_id);
        
        -- Insert payment record
        INSERT INTO investor_quarterly_payments (
            investor_id,
            declaration_id,
            gross_roi_amount,
            emergency_fund_deduction,
            tds_deduction,
            net_payable_amount,
            payment_status
        ) VALUES (
            v_investor.investor_id,
            p_declaration_id,
            v_calculation.gross_roi,
            v_calculation.emergency_fund_deduction,
            v_calculation.tds_deduction,
            v_calculation.net_payable,
            'Pending'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    -- Update emergency_fund_remaining in company_pools if emergency fund was deducted
    IF v_emergency_fund_amount > 0 AND v_purchase_id IS NOT NULL THEN
        UPDATE company_pools
        SET emergency_fund_remaining = GREATEST(0, emergency_fund_remaining - v_emergency_fund_amount)
        WHERE purchase_id = v_purchase_id;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Test the updated functions:
-- 
-- 1. Declare ROI with emergency fund:
--    INSERT INTO quarterly_roi_declarations (...)
--    VALUES (..., 50000); -- 50k emergency fund deduction
--
-- 2. Generate payments:
--    SELECT generate_quarterly_payments('declaration_id');
--
-- 3. Verify emergency_fund_remaining was updated:
--    SELECT emergency_fund_remaining FROM company_pools WHERE purchase_id = '...';

