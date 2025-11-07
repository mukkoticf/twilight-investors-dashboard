-- Add receipt_url column to investor_quarterly_payments table
ALTER TABLE public.investor_quarterly_payments 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.investor_quarterly_payments.receipt_url IS 'URL of the uploaded receipt file for this payment';

