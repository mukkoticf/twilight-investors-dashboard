-- =====================================================
-- SQL SCRIPT: FIX EMERGENCY FUND CALCULATION
-- =====================================================
-- This script updates the calculate_quarterly_roi function to stop
-- emergency fund deduction from quarter 5 onwards (Q5+)
-- Emergency fund should only be deducted for quarters 1-4 (Q1-Q4)

-- =====================================================
-- UPDATED FUNCTION: Calculate Quarterly ROI for Investor
-- =====================================================
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
    v_emergency_fund_per_quarter DECIMAL;
    v_emergency_fund_deduction DECIMAL;
    v_after_emergency DECIMAL;
    v_tds_deduction DECIMAL;
    v_net_payable DECIMAL;
    v_quarter_number INTEGER;
    v_quarter_year TEXT;
BEGIN
    -- Get investment amount for THIS SPECIFIC POOL only
    SELECT ii.investment_amount
    INTO v_total_investment
    FROM investor_investments ii
    JOIN quarterly_roi_declarations qrd ON ii.purchase_id = qrd.purchase_id
    WHERE ii.investor_id = p_investor_id
    AND qrd.declaration_id = p_declaration_id;
    
    -- Get ROI percentage and quarter year for this quarter
    SELECT roi_percentage, quarter_year
    INTO v_roi_percentage, v_quarter_year
    FROM quarterly_roi_declarations
    WHERE declaration_id = p_declaration_id;
    
    -- Calculate gross ROI
    v_gross_roi := v_total_investment * (v_roi_percentage / 100);
    
    -- Extract quarter number from quarter_year (e.g., "Q1-2024" -> 1, "Q5-2024" -> 5)
    v_quarter_number := CAST(SUBSTRING(v_quarter_year FROM 'Q(\d+)') AS INTEGER);
    
    -- Calculate emergency fund deduction only for quarters 1-4
    -- For quarters 5 and onwards, emergency fund deduction = 0
    IF v_quarter_number <= 4 THEN
        -- Get emergency fund per quarter from the actual pool
        SELECT (cp.emergency_fund_investor_share / 4)
        INTO v_emergency_fund_per_quarter
        FROM company_pools cp
        JOIN quarterly_roi_declarations qrd ON cp.purchase_id = qrd.purchase_id
        WHERE qrd.declaration_id = p_declaration_id;
        
        -- Calculate investor's share of emergency fund based on their investment percentage
        SELECT (ii.investment_amount / cp.investor_amount) * v_emergency_fund_per_quarter
        INTO v_emergency_fund_deduction
        FROM investor_investments ii
        JOIN company_pools cp ON ii.purchase_id = cp.purchase_id
        JOIN quarterly_roi_declarations qrd ON cp.purchase_id = qrd.purchase_id
        WHERE ii.investor_id = p_investor_id
        AND qrd.declaration_id = p_declaration_id;
    ELSE
        -- For quarters 5 and onwards, no emergency fund deduction
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
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the function works correctly

-- Test the function with a Q1 declaration (should have emergency fund deduction)
-- SELECT * FROM calculate_quarterly_roi('investor_id_here', 'q1_declaration_id_here');

-- Test the function with a Q5 declaration (should have 0 emergency fund deduction)
-- SELECT * FROM calculate_quarterly_roi('investor_id_here', 'q5_declaration_id_here');

-- =====================================================
-- INSTRUCTIONS FOR EXECUTION
-- =====================================================
-- 1. Execute this script in your Supabase SQL editor
-- 2. The function will be updated to handle quarter-based emergency fund deduction
-- 3. Test with existing Q1-Q4 declarations to ensure emergency fund is still deducted
-- 4. Test with Q5+ declarations to ensure emergency fund deduction is 0
-- 5. Regenerate any existing Q5+ payments if needed using generate_quarterly_payments()
-- =====================================================
