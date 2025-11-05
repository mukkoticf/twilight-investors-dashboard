-- =====================================================
-- ADMIN RLS BYPASS POLICIES
-- =====================================================
-- This script adds policies that allow admins to see all data
-- Admin is identified by email: admin@mail.com or admin@investor.com

-- =====================================================
-- Policy for investors table - Admin can see all
-- =====================================================
CREATE POLICY "Admin can view all investors"
ON public.investors
FOR SELECT
USING (
  -- Allow if user is admin (by email)
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
  OR
  -- Or allow if user_id matches (for regular investors)
  user_id = auth.uid()
);

-- =====================================================
-- Policy for investor_investments table - Admin can see all
-- =====================================================
CREATE POLICY "Admin can view all investments"
ON public.investor_investments
FOR SELECT
USING (
  -- Allow if user is admin
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
  OR
  -- Or allow if investor_id belongs to the logged-in user
  investor_id IN (
    SELECT investor_id FROM public.investors WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- Policy for investor_quarterly_payments table - Admin can see all
-- =====================================================
CREATE POLICY "Admin can view all payments"
ON public.investor_quarterly_payments
FOR SELECT
USING (
  -- Allow if user is admin
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
  OR
  -- Or allow if investor_id belongs to the logged-in user
  investor_id IN (
    SELECT investor_id FROM public.investors WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- Policy for company_pools table - Admin can see all
-- =====================================================
-- Note: company_pools might not have RLS enabled, but if it does, add this policy
-- First check if RLS is enabled, if yes, add this policy:
-- ALTER TABLE public.company_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all pools"
ON public.company_pools
FOR SELECT
USING (
  -- Allow if user is admin
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
  OR
  -- Allow all authenticated users (since pools are shared)
  auth.uid() IS NOT NULL
);

-- =====================================================
-- Policy for quarterly_roi_declarations table - Admin can see all
-- =====================================================
-- If quarterly_roi_declarations has RLS enabled, add this policy:
-- ALTER TABLE public.quarterly_roi_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all ROI declarations"
ON public.quarterly_roi_declarations
FOR SELECT
USING (
  -- Allow if user is admin
  (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
  OR
  -- Allow all authenticated users (since ROI declarations are shared)
  auth.uid() IS NOT NULL
);

