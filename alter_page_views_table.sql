-- =====================================================
-- ALTER PAGE_VIEWS TABLE - REMOVE view_id AND investor_id
-- =====================================================
-- This script modifies the existing page_views table to:
-- 1. Remove view_id column (primary key)
-- 2. Remove investor_id column
-- 3. Make investor_name a foreign key to investors table
-- =====================================================

BEGIN;

-- Step 1: Drop the primary key constraint on view_id
ALTER TABLE public.page_views 
DROP CONSTRAINT IF EXISTS page_views_pkey;

-- Step 2: Drop the foreign key constraint on investor_id (if exists)
ALTER TABLE public.page_views 
DROP CONSTRAINT IF EXISTS page_views_investor_id_fkey;

-- Step 3: Drop indexes that reference investor_id
DROP INDEX IF EXISTS idx_page_views_investor_id;
DROP INDEX IF EXISTS idx_page_views_investor_page_time;

-- Step 4: Drop the view_id column
ALTER TABLE public.page_views 
DROP COLUMN IF EXISTS view_id;

-- Step 5: Drop the investor_id column
ALTER TABLE public.page_views 
DROP COLUMN IF EXISTS investor_id;

-- Step 6: Ensure investor_name is unique in investors table (required for foreign key)
-- First, make investor_name unique if it's not already
-- Note: This will fail if there are duplicate names - you'll need to handle duplicates first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'investors_investor_name_unique'
    ) THEN
        ALTER TABLE public.investors 
        ADD CONSTRAINT investors_investor_name_unique UNIQUE (investor_name);
    END IF;
END $$;

-- Step 7: Add foreign key constraint on investor_name
-- This references investors.investor_name
ALTER TABLE public.page_views 
ADD CONSTRAINT page_views_investor_name_fkey 
FOREIGN KEY (investor_name) 
REFERENCES public.investors(investor_name) 
ON DELETE CASCADE;

-- Step 8: Create index on investor_name for better query performance
CREATE INDEX IF NOT EXISTS idx_page_views_investor_name 
ON public.page_views(investor_name);

-- Step 9: Recreate composite index for common queries (investor_name + page + time)
CREATE INDEX IF NOT EXISTS idx_page_views_investor_page_time 
ON public.page_views(investor_name, page_name, viewed_at DESC);

-- Step 10: Drop and recreate RLS policies to use investor_name instead of investor_id
DROP POLICY IF EXISTS "Investors can view own page views" ON public.page_views;

-- New policy using investor_name
CREATE POLICY "Investors can view own page views"
ON public.page_views
FOR SELECT
USING (
    investor_name IN (
        SELECT investor_name 
        FROM public.investors 
        WHERE user_id = auth.uid()
    )
);

-- Step 11: Update comments
COMMENT ON TABLE public.page_views IS 'Tracks page views by investors (not admins) for analytics purposes';
COMMENT ON COLUMN public.page_views.investor_name IS 'Name of the investor (foreign key to investors.investor_name)';
COMMENT ON COLUMN public.page_views.page_name IS 'Name of the page viewed (e.g., Investments, Investment Details)';
COMMENT ON COLUMN public.page_views.viewed_at IS 'Timestamp when the page was viewed';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'page_views'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'page_views';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'page_views';

