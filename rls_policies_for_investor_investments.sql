-- =====================================================
-- RLS POLICIES FOR investor_investments TABLE
-- =====================================================
-- This ensures investors can only see their own investments
-- Admin can see all investments

-- Step 1: Enable RLS on investor_investments (if not already enabled)
ALTER TABLE public.investor_investments ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Investors can view own investments" ON public.investor_investments;
DROP POLICY IF EXISTS "Admin can view all investments" ON public.investor_investments;

-- Step 3: Policy for investors - can only see their own investments using user_id
CREATE POLICY "Investors can view own investments"
ON public.investor_investments
FOR SELECT
USING (
  -- Allow if user_id matches the logged-in user
  user_id = auth.uid()
  OR
  -- Or allow if investor_id belongs to the logged-in user (backward compatibility)
  investor_id IN (
    SELECT investor_id FROM public.investors WHERE user_id = auth.uid()
  )
);

-- Step 4: Policy for admin - can see all investments
CREATE POLICY "Admin can view all investments"
ON public.investor_investments
FOR SELECT
USING (
  -- Allow if user is admin (by email)
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
);

-- Step 5: Verify RLS is working
-- After running this, test by:
-- 1. Login as an investor
-- 2. Query investor_investments - should only see their own records
-- 3. Login as admin - should see all records

