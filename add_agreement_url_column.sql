-- =====================================================
-- ADD AGREEMENT_URL COLUMN TO INVESTOR_INVESTMENTS TABLE
-- =====================================================
-- This script adds the agreement_url column to store agreement/receipt documents
-- per investor investment (not per pool, so each investor can have their own agreement)

ALTER TABLE public.investor_investments 
ADD COLUMN IF NOT EXISTS agreement_url TEXT;

-- =====================================================
-- OPTIONAL: CREATE SUPABASE STORAGE BUCKET FOR AGREEMENTS
-- =====================================================
-- To use Supabase Storage (recommended), create a storage bucket:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket named "agreement_file"
-- 3. Set it as public (or configure RLS policies)
-- 4. The upload functionality will automatically use it
