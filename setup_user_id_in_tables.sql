-- =====================================================
-- SIMPLE SETUP: Add user_id to investors and investor_investments
-- =====================================================

-- Step 1: Add user_id to investors table (if not exists)
ALTER TABLE public.investors 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint
ALTER TABLE public.investors
DROP CONSTRAINT IF EXISTS fk_investors_user_id;

ALTER TABLE public.investors
ADD CONSTRAINT fk_investors_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Step 2: Add user_id to investor_investments table (if not exists)
ALTER TABLE public.investor_investments 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint
ALTER TABLE public.investor_investments
DROP CONSTRAINT IF EXISTS fk_investor_investments_user_id;

ALTER TABLE public.investor_investments
ADD CONSTRAINT fk_investor_investments_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Step 3: Link investors to auth.users by email
-- Update investors table with user_id from auth.users
UPDATE public.investors i
SET user_id = (
  SELECT id FROM auth.users au 
  WHERE LOWER(au.email) = LOWER(i.email)
)
WHERE user_id IS NULL;

-- Step 4: Populate user_id in investor_investments from investors table
-- This updates ALL existing records, not just NULL ones
UPDATE public.investor_investments ii
SET user_id = i.user_id
FROM public.investors i
WHERE ii.investor_id = i.investor_id
  AND i.user_id IS NOT NULL;

-- Step 5: Create trigger to auto-populate user_id when NEW investment is inserted
-- This ensures user_id is automatically set when creating investments
CREATE OR REPLACE FUNCTION auto_set_investor_investments_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.investor_id IS NOT NULL THEN
    NEW.user_id := (
      SELECT user_id 
      FROM public.investors 
      WHERE investor_id = NEW.investor_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_set_investor_investments_user_id ON public.investor_investments;

CREATE TRIGGER trigger_auto_set_investor_investments_user_id
BEFORE INSERT ON public.investor_investments
FOR EACH ROW
EXECUTE FUNCTION auto_set_investor_investments_user_id();

-- Step 6: Verify the setup
SELECT 
  'investors' as table_name,
  COUNT(*) as total_records,
  COUNT(user_id) as records_with_user_id
FROM public.investors
UNION ALL
SELECT 
  'investor_investments' as table_name,
  COUNT(*) as total_records,
  COUNT(user_id) as records_with_user_id
FROM public.investor_investments;

