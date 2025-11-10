-- =====================================================
-- UPDATE PAGE_VIEWS TIMESTAMPS TO CURRENT TIME
-- =====================================================
-- This script updates all viewed_at timestamps to the current UTC time
-- Use this if you want to set all page views to "now"
-- =====================================================

-- Update all page views to current UTC time
UPDATE public.page_views
SET viewed_at = NOW()
WHERE viewed_at IS NOT NULL;

-- Or update a specific record by investor_name and page_name
-- UPDATE public.page_views
-- SET viewed_at = NOW()
-- WHERE investor_name = 'Saanwra Khod' 
--   AND page_name = 'Investment Details';

-- Or update to a specific time (in UTC)
-- UPDATE public.page_views
-- SET viewed_at = '2025-11-08 11:38:00+00'::timestamptz
-- WHERE investor_name = 'Saanwra Khod' 
--   AND page_name = 'Investment Details';

-- Verify the update
SELECT 
    investor_name,
    page_name,
    viewed_at,
    created_at
FROM public.page_views
ORDER BY viewed_at DESC;


