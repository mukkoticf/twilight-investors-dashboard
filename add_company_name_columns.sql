-- =====================================================
-- ADD COMPANY_NAME COLUMNS TO INVESTMENTS AND PAYMENTS
-- =====================================================
-- This script:
-- 1. Creates a companies table if it doesn't exist
-- 2. Adds company_name foreign key to investor_investments
-- 3. Adds company_name foreign key to investor_quarterly_payments
-- 4. Populates existing data with company names from pool owner_names
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create companies table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS public.companies (
    company_name TEXT PRIMARY KEY,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert common companies if they don't exist
INSERT INTO public.companies (company_name, description, is_active)
VALUES 
    ('SIMSA', 'SIMSA company', true),
    ('BSPN', 'BSPN company', true),
    ('Anilsiva', 'Anilsiva company', true),
    ('KPCr', 'KPCr company', true),
    ('SKN/Smart', 'SKN/Smart company', true)
ON CONFLICT (company_name) DO NOTHING;

-- =====================================================
-- STEP 2: Add company_name column to investor_investments
-- =====================================================

-- Add company_name column (nullable initially for existing data)
ALTER TABLE public.investor_investments
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'investor_investments_company_name_fkey'
    ) THEN
        ALTER TABLE public.investor_investments
        ADD CONSTRAINT investor_investments_company_name_fkey
        FOREIGN KEY (company_name) REFERENCES public.companies(company_name);
    END IF;
END $$;

-- =====================================================
-- STEP 3: Add company_name column to investor_quarterly_payments
-- =====================================================

-- Add company_name column (nullable initially for existing data)
ALTER TABLE public.investor_quarterly_payments
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'investor_quarterly_payments_company_name_fkey'
    ) THEN
        ALTER TABLE public.investor_quarterly_payments
        ADD CONSTRAINT investor_quarterly_payments_company_name_fkey
        FOREIGN KEY (company_name) REFERENCES public.companies(company_name);
    END IF;
END $$;

-- =====================================================
-- STEP 4: Populate existing investor_investments with company_name
-- =====================================================
-- This assumes the first owner_name in the pool's owner_names array
-- represents the primary company for investments in that pool

UPDATE public.investor_investments ii
SET company_name = (
    SELECT cp.owner_names[1]
    FROM public.company_pools cp
    WHERE cp.purchase_id = ii.purchase_id
    AND array_length(cp.owner_names, 1) > 0
)
WHERE ii.company_name IS NULL;

-- =====================================================
-- STEP 5: Populate existing investor_quarterly_payments with company_name
-- =====================================================
-- Get company_name from the investment's pool owner_names

UPDATE public.investor_quarterly_payments iqp
SET company_name = (
    SELECT cp.owner_names[1]
    FROM public.quarterly_roi_declarations qrd
    JOIN public.company_pools cp ON qrd.purchase_id = cp.purchase_id
    WHERE qrd.declaration_id = iqp.declaration_id
    AND array_length(cp.owner_names, 1) > 0
)
WHERE iqp.company_name IS NULL;

-- =====================================================
-- STEP 6: Make company_name NOT NULL after populating data
-- =====================================================
-- Note: Only do this if all rows have been populated
-- Uncomment these lines after verifying all data is populated

-- ALTER TABLE public.investor_investments
-- ALTER COLUMN company_name SET NOT NULL;

-- ALTER TABLE public.investor_quarterly_payments
-- ALTER COLUMN company_name SET NOT NULL;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check companies table
-- SELECT * FROM public.companies;

-- Check investor_investments with company_name
-- SELECT investment_id, investor_id, purchase_id, company_name 
-- FROM public.investor_investments 
-- LIMIT 10;

-- Check investor_quarterly_payments with company_name
-- SELECT payment_id, investor_id, declaration_id, company_name 
-- FROM public.investor_quarterly_payments 
-- LIMIT 10;

-- Check for any NULL company_name values
-- SELECT COUNT(*) as null_investments 
-- FROM public.investor_investments 
-- WHERE company_name IS NULL;

-- SELECT COUNT(*) as null_payments 
-- FROM public.investor_quarterly_payments 
-- WHERE company_name IS NULL;

