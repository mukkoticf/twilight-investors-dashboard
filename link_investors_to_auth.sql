-- =====================================================
-- STEP 1: Add user_id column to investors table
-- =====================================================
ALTER TABLE public.investors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- =====================================================
-- STEP 2: Populate user_id by matching emails
-- =====================================================
-- Update each investor's user_id by matching their email with auth.users

-- For Rahul (rahul@example.com -> rahul@mail.com)
UPDATE public.investors 
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'rahul@mail.com'
)
WHERE email = 'rahul@example.com';

-- For Akhil (akhil@example.com -> akhil@mail.com)
UPDATE public.investors 
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'akhil@mail.com'
)
WHERE email = 'akhil@example.com';

-- For Vinod (vinod@example.com -> vinod@mail.com)
UPDATE public.investors 
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'vinod@mail.com'
)
WHERE email = 'vinod@example.com';

-- =====================================================
-- STEP 3: Verify the updates
-- =====================================================
-- Check if all investors are linked correctly
SELECT 
  i.investor_id,
  i.investor_name,
  i.email as investor_email,
  au.email as auth_email,
  i.user_id
FROM public.investors i
LEFT JOIN auth.users au ON i.user_id = au.id;

-- =====================================================
-- STEP 4: Enable Row Level Security (RLS)
-- =====================================================
-- Enable RLS on investors table
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS Policy for Investors
-- =====================================================
-- Policy: Investors can only see their own record
CREATE POLICY "Investors can view own data"
ON public.investors
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admin can see all investors (if you have admin role)
-- First, you'll need to identify admin users. 
-- For now, we'll create a policy that allows users to see their own data
-- You can add admin-specific policies later

-- =====================================================
-- STEP 6: Enable RLS on related tables
-- =====================================================
-- Enable RLS on investor_investments
ALTER TABLE public.investor_investments ENABLE ROW LEVEL SECURITY;

-- Policy: Investors can only see their own investments
CREATE POLICY "Investors can view own investments"
ON public.investor_investments
FOR SELECT
USING (
  investor_id IN (
    SELECT investor_id FROM public.investors WHERE user_id = auth.uid()
  )
);

-- Enable RLS on investor_quarterly_payments
ALTER TABLE public.investor_quarterly_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Investors can only see their own payments
CREATE POLICY "Investors can view own payments"
ON public.investor_quarterly_payments
FOR SELECT
USING (
  investor_id IN (
    SELECT investor_id FROM public.investors WHERE user_id = auth.uid()
  )
);

