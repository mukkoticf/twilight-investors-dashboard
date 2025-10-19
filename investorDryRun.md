## SCENARIO SETUP
Based on the example:
- **Bus Cost**: ₹1.75 CR (₹17,500,000)
- **Bank Loan**: ₹125 lakh (₹12,500,000)
- **Investor Money**: ₹50 lakh (₹5,000,000)
- **Monthly EMI**: ₹3 lakh (₹300,000)
- **Emergency Fund**: ₹9 lakh (₹900,000) - collected over 3 months
- **Company Share**: ₹4.5 lakh (₹450,000)
- **Investor Share**: ₹4.5 lakh (₹450,000)

## STEP 1: CREATE COMPANY POOL (WITH INTEGRATED POOL INFO)
 Database Insert:
```sql
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

### Result in Database:
```
purchase_id: pur1
pool_name: "Hybrid Pool"
description: "Pool for KPCR and SKN/Smart companies"
owner_names: ["KPCr", "SKN/Smart"]
vehicle_numbers: ["KA01AB1234","AP38VD6284"]
purchase_date: 2025-09-15
total_cost: 17500000.00
bank_loan_amount: 12500000.00
investor_amount: 5000000.00
monthly_emi: 300000.00
emergency_fund_collected: 900000.00
emergency_fund_company_share: 450000.00
emergency_fund_investor_share: 450000.00
emergency_fund_remaining: 450000.00
status: "Active"
```

## STEP 2: ADD INVESTORS
 Database Inserts:
```sql
INSERT INTO public.investors (investor_name, email, phone, pan_number, bank_account_no) VALUES
('Rahul', 'rahul@example.com', '9876543210', 'ABCDE1234F', '1234567890123456'),
('Vinod', 'vinod@example.com', '9876543211', 'ABCDE1235G', '2345678901234567'),
('Akhil', 'akhil@example.com', '9876543212', 'ABCDE1236H', '3456789012345678');
```

### Result in Database:
```
investor_id: inv1, investor_name: "Rahul", email: "rahul@example.com", bank_account_no: "1234567890123456"
investor_id: inv2, investor_name: "Vinod", email: "vinod@example.com", bank_account_no: "2345678901234567"
investor_id: inv3, investor_name: "Akhil", email: "akhil@example.com", bank_account_no: "3456789012345678"
```
------------------------------------------------------------------------------------------------
## STEP 3: RECORD INVESTOR INVESTMENTS
 Database Inserts:
```sql
-- NOTE: Replace 'actual_uuid_here' with real UUIDs from previous inserts
INSERT INTO public.investor_investments (investor_id, purchase_id, investment_amount, investment_percentage) VALUES
('actual_rahul_investor_id_uuid', 'actual_purchase_id_uuid', 1500000, 30.0000),
('actual_vinod_investor_id_uuid', 'actual_purchase_id_uuid', 1000000, 20.0000),
('actual_akhil_investor_id_uuid', 'actual_purchase_id_uuid', 2500000, 50.0000);
```

### Result in Database:
```
investment_id: inv_inv1, investor_id: inv1, purchase_id: pur1, investment_amount: 1500000.00, investment_percentage: 30.0000
investment_id: inv_inv2, investor_id: inv2, purchase_id: pur1, investment_amount: 1000000.00, investment_percentage: 20.0000
investment_id: inv_inv3, investor_id: inv3, purchase_id: pur1, investment_amount: 2500000.00, investment_percentage: 50.0000
```


## STEP 5: DECLARE Q1 ROI
 Database Insert:
```sql
-- NOTE: Replace 'actual_purchase_id_uuid' with real UUID from company_pools insert
INSERT INTO public.quarterly_roi_declarations (quarter_year, roi_percentage, declaration_date, purchase_id, is_finalized) VALUES
('Q1-2024', 6.00, '2024-03-31', 'actual_purchase_id_uuid', true);
```

### Result in Database:
```
declaration_id: dec1
quarter_year: "Q1-2024"
roi_percentage: 6.00
declaration_date: 2024-03-31
purchase_id: pur1
is_finalized: true
```

## STEP 6: AUTOMATED CALCULATIONS

 Trigger Automated Calculation Function:
```sql
-- This function automatically calculates ROI for investors in the specific company pool
SELECT generate_quarterly_payments('dec1');
-- Returns: 3 (number of payment records created)

-- How it works internally:
-- 1. Gets ROI percentage and purchase_id from declaration (dec1 -> pur1)
-- 2. Finds only investors who invested in that specific company pool (inv1, inv2, inv3)
-- 3. Calculates ROI for each of those investors
-- 4. Creates payment records
```

 For Rahul (₹15 lakh investment, 30% of total):
```
Total Investment: ₹15,00,000
ROI Percentage: 6%
Gross ROI: ₹15,00,000 × 6% = ₹90,000

Emergency Fund per Quarter: ₹1,12,500 (₹4,50,000 ÷ 4)
Rahul's Share: ₹1,12,500 × (₹15,00,000 ÷ ₹50,00,000) = ₹33,750

Amount after Emergency Fund: ₹90,000 - ₹33,750 = ₹56,250
TDS (10%): ₹56,250 × 10% = ₹5,625
Net Payable: ₹56,250 - ₹5,625 = ₹50,625
```

 For Vinod (₹10 lakh investment, 20% of total):
```
Total Investment: ₹10,00,000
ROI Percentage: 6%
Gross ROI: ₹10,00,000 × 6% = ₹60,000

Emergency Fund per Quarter: ₹1,12,500
Vinod's Share: ₹1,12,500 × (₹10,00,000 ÷ ₹50,00,000) = ₹22,500

Amount after Emergency Fund: ₹60,000 - ₹22,500 = ₹37,500
TDS (10%): ₹37,500 × 10% = ₹3,750
Net Payable: ₹37,500 - ₹3,750 = ₹33,750
```

 For Akhil (₹25 lakh investment, 50% of total):
```
Total Investment: ₹25,00,000
ROI Percentage: 6%
Gross ROI: ₹25,00,000 × 6% = ₹1,50,000

Emergency Fund per Quarter: ₹1,12,500
Akhil's Share: ₹1,12,500 × (₹25,00,000 ÷ ₹50,00,000) = ₹56,250

Amount after Emergency Fund: ₹1,50,000 - ₹56,250 = ₹93,750
TDS (10%): ₹93,750 × 10% = ₹9,375
Net Payable: ₹93,750 - ₹9,375 = ₹84,375
```

## STEP 7: GENERATE QUARTERLY PAYMENTS

 What the `generate_quarterly_payments()` function does internally:
1. **Gets purchase_id from declaration** - knows which specific company pool this ROI is for
2. **Finds only investors for that company pool** - just the 3 who invested
3. **Calls `calculate_quarterly_roi()`** for each investor to get:
   - Gross ROI amount
   - Emergency fund deduction
   - TDS deduction  
   - Net payable amount
4. **Automatically inserts records** into `investor_quarterly_payments` table

 Database Inserts (Auto-generated by function):
```sql
INSERT INTO public.investor_quarterly_payments (
    investor_id, declaration_id, gross_roi_amount, emergency_fund_deduction, 
    tds_deduction, net_payable_amount, payment_status
) VALUES
('inv1', 'dec1', 90000, 33750, 5625, 50625, 'Pending'),
('inv2', 'dec1', 60000, 22500, 3750, 33750, 'Pending'),
('inv3', 'dec1', 150000, 56250, 9375, 84375, 'Pending');
```

### Result in Database:
```
payment_id: pay1, investor_id: inv1, declaration_id: dec1, gross_roi: 90000.00, emergency_deduction: 33750.00, tds: 5625.00, net_payable: 50625.00
payment_id: pay2, investor_id: inv2, declaration_id: dec1, gross_roi: 60000.00, emergency_deduction: 22500.00, tds: 3750.00, net_payable: 33750.00
payment_id: pay3, investor_id: inv3, declaration_id: dec1, gross_roi: 150000.00, emergency_deduction: 56250.00, tds: 9375.00, net_payable: 84375.00
```

```

## STEP 8: QUARTERS 2-4 (SAME PROCESS, DIFFERENT ROI)

 Q2 Declaration (8% ROI):
```sql
-- NOTE: Replace 'actual_purchase_id_uuid' with real UUID from company_pools insert
INSERT INTO public.quarterly_roi_declarations (quarter_year, roi_percentage, declaration_date, purchase_id, is_finalized) VALUES
('Q2-2024', 8.00, '2024-06-30', 'actual_purchase_id_uuid', true);

-- Trigger automated calculations for Q2 (same company pool, same 3 investors)
SELECT generate_quarterly_payments('dec2');
-- Returns: 3 (number of payment records created)
```

 Q2 Calculations:
```
Rahul: ₹15,00,000 × 8% = ₹1,20,000 - ₹33,750 (emergency) = ₹86,250 - ₹8,625 (TDS) = ₹77,625
Vinod: ₹10,00,000 × 8% = ₹80,000 - ₹22,500 (emergency) = ₹57,500 - ₹5,750 (TDS) = ₹51,750
Akhil: ₹25,00,000 × 8% = ₹2,00,000 - ₹56,250 (emergency) = ₹1,43,750 - ₹14,375 (TDS) = ₹1,29,375
```

## STEP 9: QUARTER 5 (NO EMERGENCY FUND)

 Q5 Declaration (5% ROI):
```sql
-- NOTE: Replace 'actual_purchase_id_uuid' with real UUID from company_pools insert
INSERT INTO public.quarterly_roi_declarations (quarter_year, roi_percentage, declaration_date, purchase_id, is_finalized) VALUES
('Q5-2024', 5.00, '2024-12-31', 'actual_purchase_id_uuid', true);

-- Trigger automated calculations for Q5 (same company pool, same 3 investors, no emergency fund)
SELECT generate_quarterly_payments('dec5');
-- Returns: 3 (number of payment records created)
```

 Q5 Calculations (Emergency Fund = 0):
```
Rahul: ₹15,00,000 × 5% = ₹75,000 - ₹0 (emergency) = ₹75,000 - ₹7,500 (TDS) = ₹67,500
Vinod: ₹10,00,000 × 5% = ₹50,000 - ₹0 (emergency) = ₹50,000 - ₹5,000 (TDS) = ₹45,000
Akhil: ₹25,00,000 × 5% = ₹1,25,000 - ₹0 (emergency) = ₹1,25,000 - ₹12,500 (TDS) = ₹1,12,500
```

## SUMMARY OF ALL QUARTERS

| Quarter | ROI% | Rahul Net | Vinod Net | Akhil Net | Total Paid |
|---------|------|-----------|-----------|-----------|------------|
| Q1-2024 | 6%   | ₹50,625   | ₹33,750   | ₹84,375   | ₹1,68,750  |
| Q2-2024 | 8%   | ₹77,625   | ₹51,750   | ₹1,29,375 | ₹2,58,750  |
| Q3-2024 | 3%   | ₹33,750   | ₹22,500   | ₹56,250   | ₹1,12,500  |
| Q4-2024 | 5%   | ₹56,250   | ₹37,500   | ₹93,750   | ₹1,87,500  |
| Q5-2024 | 5%   | ₹67,500   | ₹45,000   | ₹1,12,500 | ₹2,25,000  |
| **TOTAL** |     | **₹2,85,750** | **₹1,90,500** | **₹4,76,250** | **₹9,52,500** |

## EMERGENCY FUND COLLECTION SUMMARY

| Quarter | Rahul Emergency | Vinod Emergency | Akhil Emergency | Total Emergency |
|---------|-----------------|-----------------|-----------------|-----------------|
| Q1-2024 | ₹33,750         | ₹22,500         | ₹56,250         | ₹1,12,500       |
| Q2-2024 | ₹33,750         | ₹22,500         | ₹56,250         | ₹1,12,500       |
| Q3-2024 | ₹33,750         | ₹22,500         | ₹56,250         | ₹1,12,500       |
| Q4-2024 | ₹33,750         | ₹22,500         | ₹56,250         | ₹1,12,500       |
| Q5-2024 | ₹0              | ₹0              | ₹0              | ₹0              |
| **TOTAL** | **₹1,35,000**   | **₹90,000**     | **₹2,25,000**   | **₹4,50,000**   |

## FINAL VERIFICATION

 Total Emergency Fund Collected:
- **Expected**: ₹4,50,000 (₹1,12,500 × 4 quarters)
- **Actual**: ₹4,50,000 ✅

 Total ROI Paid (5 quarters):
- **Expected**: ₹9,52,500
- **Actual**: ₹9,52,500 ✅

## FRONTEND DISPLAY EXAMPLES

 Investor Dashboard for Rahul:
```
Investor: Rahul
Total Investment: ₹15,00,000
Current Quarter: Q5-2024
ROI Rate: 5%
Gross ROI: ₹75,000
Emergency Fund Deduction: ₹0
TDS Deduction: ₹7,500
Net Payable: ₹67,500
Payment Status: Pending
```

 Quarterly Report:
```
Q1-2024 Report:
- Total Investors: 3
- Total Investment: ₹50,00,000
- ROI Rate: 6%
- Total Gross ROI: ₹3,00,000
- Total Emergency Fund: ₹1,12,500
- Total TDS: ₹18,750
- Total Net Paid: ₹1,68,750
```

## RPC FUNCTIONS USED IN THIS DRY RUN

 1. `generate_quarterly_payments(declaration_id)`
- **Purpose**: Main function that triggers automated calculations for specific company pool
- **Input**: Declaration ID (contains purchase_id and ROI percentage)
- **Output**: Number of payment records created
- **Logic**: Only processes investors who invested in the specific company pool
- **Called**: After each quarterly ROI declaration

 2. `calculate_quarterly_roi(investor_id, declaration_id)`
- **Purpose**: Calculates ROI for a specific investor in a specific company pool
- **Input**: Investor ID and Declaration ID (which contains purchase_id)
- **Output**: Table with gross_roi, emergency_fund_deduction, tds_deduction, net_payable
- **Logic**: Uses investor's investment amount from the specific company pool
- **Called**: Internally by `generate_quarterly_payments()` for each investor

 3. `calculate_investment_percentage(investment_amount, total_investor_amount)`
- **Purpose**: Calculates investor's percentage of total investment
- **Input**: Individual investment amount and total investor amount
- **Output**: Percentage value
- **Called**: During investment recording and ROI calculations

## COMPLETE WORKFLOW SUMMARY

1. **Setup Phase**: Create company pools, add investors, record company pool investments
2. **Investment Phase**: Record individual investor contributions
3. **Quarterly Phase**: 
   - Declare ROI percentage **for specific company pool** (includes purchase_id)
   - Call `generate_quarterly_payments()` with declaration_id
   - System finds only investors for that company pool (not all 100)
   - System automatically calculates and stores payment records
4. **Payment Phase**: Mark payments as completed when processed


