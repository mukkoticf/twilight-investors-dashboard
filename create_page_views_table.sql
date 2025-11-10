-- =====================================================
-- PAGE VIEWS TABLE - INVESTOR ANALYTICS
-- =====================================================
-- This table tracks which investors have opened specific pages in the app
-- Only tracks investor page views (not admin views)
-- =====================================================

-- Create page_views table
CREATE TABLE IF NOT EXISTS public.page_views (
    view_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(investor_id) ON DELETE CASCADE,
    investor_name TEXT NOT NULL,
    page_name TEXT NOT NULL, -- 'Investments', 'Investment Details', etc.
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on investor_id for faster queries
CREATE INDEX IF NOT EXISTS idx_page_views_investor_id ON public.page_views(investor_id);

-- Create index on viewed_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON public.page_views(viewed_at DESC);

-- Create index on page_name for page-specific analytics
CREATE INDEX IF NOT EXISTS idx_page_views_page_name ON public.page_views(page_name);

-- Create composite index for common queries (investor + page + time)
CREATE INDEX IF NOT EXISTS idx_page_views_investor_page_time ON public.page_views(investor_id, page_name, viewed_at DESC);

-- Add comment to table
COMMENT ON TABLE public.page_views IS 'Tracks page views by investors (not admins) for analytics purposes';

-- Add comments to columns
COMMENT ON COLUMN public.page_views.investor_id IS 'Reference to the investor who viewed the page';
COMMENT ON COLUMN public.page_views.investor_name IS 'Name of the investor (denormalized for easier querying)';
COMMENT ON COLUMN public.page_views.page_name IS 'Name of the page viewed (e.g., Investments, Investment Details)';
COMMENT ON COLUMN public.page_views.viewed_at IS 'Timestamp when the page was viewed';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Policy: Investors can view their own page views
CREATE POLICY "Investors can view own page views"
ON public.page_views
FOR SELECT
USING (
    investor_id IN (
        SELECT investor_id 
        FROM public.investors 
        WHERE user_id = auth.uid()
    )
);

-- Policy: System can insert page views (for tracking)
-- This allows the app to insert page views for any investor
-- You may want to restrict this further if needed
CREATE POLICY "Allow page view inserts"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Policy: Admins can view all page views
-- Admins are identified by email in AuthContext
-- For RLS, we'll allow if user is not an investor (admin check happens in app)
CREATE POLICY "Admins can view all page views"
ON public.page_views
FOR SELECT
USING (
    -- Allow if user is not linked to any investor (likely admin)
    NOT EXISTS (
        SELECT 1 
        FROM public.investors 
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'page_views'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'page_views';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'page_views';

