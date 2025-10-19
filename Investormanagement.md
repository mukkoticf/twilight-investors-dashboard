# INVESTOR MANAGEMENT SYSTEM - COMPLETE IMPLEMENTATION

## OVERVIEW
This system manages investor money for bus purchases across multiple companies (BSPN, Simsa, Anilseva, KPCr, SKN/Smart) with pool-based investment management, quarterly ROI calculations, emergency fund management, and TDS handling.


## COMPLETE DATABASE SCHEMA

### 1. company_pools MANAGEMENT
```sql
-- Create company_pools table with integrated pool information
CREATE TABLE public.company_pools (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_name TEXT NOT NULL, -- "Hybrid Pool", "BSPN Pool", etc.
    description TEXT, -- "Pool for KPCR and SKN/Smart companies"
    owner_names TEXT[] NOT NULL, -- Array of company names (BSPN, Simsa, Anilseva, KPCr, SKN/Smart)
    vehicle_numbers TEXT[] NOT NULL, -- Array of vehicle numbers for this purchase
    purchase_date DATE NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL, -- 1.75 CR = 17500000
    bank_loan_amount DECIMAL(15,2) NOT NULL, -- 12500000 (125 lakh)
    investor_amount DECIMAL(15,2) NOT NULL, -- 5000000 (50 lakh)
    monthly_emi DECIMAL(15,2) NOT NULL, -- 300000 (3 lakh)
    emergency_fund_collected DECIMAL(15,2) NOT NULL DEFAULT 0, -- 900000 (9 lakh)
    emergency_fund_company_share DECIMAL(15,2) NOT NULL DEFAULT 0, -- 450000 (4.5 lakh)
    emergency_fund_investor_share DECIMAL(15,2) NOT NULL DEFAULT 0, -- 450000 (4.5 lakh)
    emergency_fund_remaining DECIMAL(15,2) NOT NULL DEFAULT 0, -- Track remaining emergency fund
    status TEXT NOT NULL DEFAULT 'Active', -- Active, Sold, Transferred
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example insert for your business
INSERT INTO public.company_pools (
    pool_name, description, owner_names, vehicle_numbers, purchase_date,
    total_cost, bank_loan_amount, investor_amount, monthly_emi,
    emergency_fund_collected, emergency_fund_company_share, emergency_fund_investor_share,
    emergency_fund_remaining
) VALUES (
    'Hybrid Pool', 'Pool for KPCR and SKN/Smart companies', 
    ARRAY['KPCr', 'SKN/Smart'], ARRAY['KA01AB1234','AP38VD6284'], '2025-09-15',
    17500000, 12500000, 5000000, 300000,
    900000, 450000, 450000, 450000
);
```

### 2. INVESTOR MANAGEMENT
```sql
-- Create investors table
CREATE TABLE public.investors (
    investor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    pan_number TEXT UNIQUE,
    bank_account_no TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create investor investments table
CREATE TABLE public.investor_investments (
    investment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(investor_id),
    purchase_id UUID NOT NULL REFERENCES public.company_pools(purchase_id),
    investment_amount DECIMAL(15,2) NOT NULL,
    investment_percentage DECIMAL(5,4) NOT NULL, -- Calculated as (investment_amount / total_investor_amount) * 100
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. QUARTERLY ROI MANAGEMENT
```sql
-- Create quarterly ROI declarations table
CREATE TABLE public.quarterly_roi_declarations (
    declaration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quarter_year TEXT NOT NULL, -- Format: "Q1-2024", "Q2-2024", etc.
    roi_percentage DECIMAL(5,2) NOT NULL, -- 6.00, 8.00, etc.
    declaration_date DATE NOT NULL,
    purchase_id UUID NOT NULL REFERENCES public.company_pools(purchase_id),
    is_finalized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(quarter_year, purchase_id)
);

-- Create investor quarterly payments table
CREATE TABLE public.investor_quarterly_payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(investor_id),
    declaration_id UUID NOT NULL REFERENCES public.quarterly_roi_declarations(declaration_id),
    gross_roi_amount DECIMAL(15,2) NOT NULL, -- Before deductions
    emergency_fund_deduction DECIMAL(15,2) NOT NULL DEFAULT 0,
    tds_deduction DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_payable_amount DECIMAL(15,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Paid, Failed
    payment_date DATE,
    payment_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## AUTOMATED CALCULATION FUNCTIONS

### 1. Calculate Investment Percentage
```sql
CREATE OR REPLACE FUNCTION calculate_investment_percentage(
    p_investment_amount DECIMAL,
    p_total_investor_amount DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF p_total_investor_amount = 0 THEN
        RETURN 0;
    END IF;
    RETURN (p_investment_amount / p_total_investor_amount) * 100;
END;
$$ LANGUAGE plpgsql;
```

### 2. Calculate Quarterly ROI for Investor
```sql
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
BEGIN
    -- Get total investment amount for this investor
    SELECT COALESCE(SUM(ii.investment_amount), 0)
    INTO v_total_investment
    FROM investor_investments ii
    JOIN company_pools vp ON ii.purchase_id = vp.purchase_id
    WHERE ii.investor_id = p_investor_id
    AND vp.status = 'Active';
    
    -- Get ROI percentage for this quarter
    SELECT roi_percentage
    INTO v_roi_percentage
    FROM quarterly_roi_declarations
    WHERE declaration_id = p_declaration_id;
    
    -- Calculate gross ROI
    v_gross_roi := v_total_investment * (v_roi_percentage / 100);
    
    -- Calculate emergency fund deduction (4.5 lakh / 4 quarters = 1.125 lakh per quarter)
    v_emergency_fund_per_quarter := 112500; -- 1.125 lakh
    
    -- Calculate investor's share of emergency fund based on their investment percentage
    SELECT (ii.investment_amount / vp.investor_amount) * v_emergency_fund_per_quarter
    INTO v_emergency_fund_deduction
    FROM investor_investments ii
    JOIN company_pools vp ON ii.purchase_id = vp.purchase_id
    WHERE ii.investor_id = p_investor_id
    AND vp.status = 'Active'
    LIMIT 1;
    
    -- Calculate amount after emergency fund deduction
    v_after_emergency := v_gross_roi - COALESCE(v_emergency_fund_deduction, 0);
    
    -- Calculate TDS (10% of amount after emergency fund deduction)
    v_tds_deduction := v_after_emergency * 0.10;
    
    -- Calculate net payable
    v_net_payable := v_after_emergency - v_tds_deduction;
    
    RETURN QUERY SELECT v_gross_roi, COALESCE(v_emergency_fund_deduction, 0), v_tds_deduction, v_net_payable;
END;
$$ LANGUAGE plpgsql;
```

### 3. Generate Quarterly Payments for All Investors
```sql
CREATE OR REPLACE FUNCTION generate_quarterly_payments(
    p_declaration_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_investor RECORD;
    v_calculation RECORD;
    v_payment_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Loop through all active investors
    FOR v_investor IN 
        SELECT DISTINCT i.investor_id
        FROM investors i
        JOIN investor_investments ii ON i.investor_id = ii.investor_id
        JOIN company_pools vp ON ii.purchase_id = vp.purchase_id
        WHERE i.is_active = true AND vp.status = 'Active'
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
            net_payable_amount
        ) VALUES (
            v_investor.investor_id,
            p_declaration_id,
            v_calculation.gross_roi,
            v_calculation.emergency_fund_deduction,
            v_calculation.tds_deduction,
            v_calculation.net_payable
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

## FRONTEND IMPLEMENTATION

### 1. Investor Management Page
```typescript
// src/pages/InvestorManagementPage.tsx
```

### 2. company_pools Management
```typescript
// src/pages/company_poolsPage.tsx
```

## USAGE WORKFLOW

### 1. Setup Phase
1. **Create Investment Pools**: Set up hybrid pools with company names and vehicle numbers
2. **Add Investors**: Register all investors with their details
3. **Link Investments**: Connect investors to specific company pools with investment amounts

### 2. Company Pool Phase
1. **Record Purchase**: When buying a bus for ₹1.75 CR
2. **Split Funding**: ₹125 lakh bank loan + ₹50 lakh investor money
3. **Calculate EMI**: ₹3 lakh monthly EMI
4. **Collect Emergency Fund**: ₹9 lakh (₹4.5 lakh company + ₹4.5 lakh investors)

### 3. Quarterly ROI Phase
1. **Declare ROI**: Set ROI percentage for the quarter (e.g., 6%)
2. **Generate Payments**: System automatically calculates for all investors
3. **Review Calculations**: 
   - Gross ROI = Investment × ROI%
   - Emergency Fund Deduction = (Investment/Total) × ₹1.125 lakh
   - TDS = 10% of (Gross ROI - Emergency Fund)
   - Net Payable = Gross ROI - Emergency Fund - TDS
4. **Process Payments**: Mark payments as paid when completed

### 4. Quarter 5+ (No Emergency Fund)
1. **Same Process**: But emergency fund deduction = 0
2. **Only TDS**: Deduct 10% TDS from gross ROI

## FRESH IMPLEMENTATION WORKFLOW

### 1. Company Pool Setup
- Create investment pools for different company combinations
- Manually enter company names (BSPN, Simsa, Anilseva, KPCr, SKN/Smart)
- Manually enter vehicle numbers for each pool
- Set up financial details (costs, loans, investor amounts)

### 2. Investor Management
- Register all investors with their details
- Link investors to specific company pools
- Track individual investment amounts and percentages

### 3. Quarterly ROI Management
- Declare quarterly ROI percentages
- System automatically calculates payments for all investors
- Track payment status and history

### 4. Reporting & Analytics
- Generate investor dashboards
- Create quarterly reports
- Track ROI performance over time
- Monitor emergency fund collections

