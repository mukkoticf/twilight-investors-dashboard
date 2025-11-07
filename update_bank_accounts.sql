-- =====================================================
-- UPDATE BANK ACCOUNT NUMBERS FROM CSV DATA
-- =====================================================
-- This query updates bank_account_no for all investors
-- based on the Receiver Account Number from the CSV
-- =====================================================

BEGIN;

-- Update bank account numbers using email matching
UPDATE public.investors i
SET 
    bank_account_no = mapping.account_no,
    updated_at = NOW()
FROM (
    VALUES
        -- Investor Email → Receiver Account Number
        ('saanwra5090@gmail.com', '50100591409656'),
        ('bspn96@gmail.com', '50100591409656'),
        ('pramodreddy620@gmail.com', '50100591409656'),
        ('skntradersxroad@gmail.com', '50100591409656'),
        ('adityacharans210@gmail.com', '50100591409656'),
        ('k.samatham3157@gmail.com', '50100591409656'),
        ('mungaranikhil@gmail.com', '50100591409656'),
        ('nandalal.are@gmail.com', '50100591409656'),
        ('rupeshminchala1996@gmail.com', '50100591409656'),
        ('ankitchahar11@gmail.com', '50100591409656'),
        ('umangpardhi@gmail.com', '50100591409656'),
        ('ysbhargav123@gmail.com', '50100591409656'),
        ('suritikhod@gmail.com', '50100591409656'),
        ('anilmukkoti@gmail.com', '919010027937741'),
        ('dabbirusaisuraj@gmail.com', '919010027937741'),
        ('madan22@yahoo.com', '919010027937741'),
        ('bkalpana@gmail.com', '919010027937741'),
        ('ktallapally@gmail.com', '919010027937741'),
        ('hema_mukkoti@yahoo.com', '919010027937741'),
        ('saketagrawal780@gmail.com', '919010027937741'),
        ('abhishek.tnpd@gmail.com', '919010027937741'),
        ('nayanjyotikakati1997@gmail.com', '919010027937741'),
        ('patoliyameet439@gmail.com', '919010027937741'),
        ('tyagiabhishek13@gmail.com', '919010027937741'),
        ('bkuladeepreddy@gmail.com', '919010027937741'),
        ('mevin713@gmail.com', '919010027937741')
) AS mapping(email, account_no)
WHERE LOWER(i.email) = LOWER(mapping.email)
  AND (i.bank_account_no IS NULL OR i.bank_account_no != mapping.account_no);

-- Verify the updates
SELECT 
    investor_id,
    investor_name,
    email,
    bank_account_no,
    updated_at
FROM public.investors
WHERE bank_account_no IS NOT NULL
ORDER BY updated_at DESC, investor_name;

COMMIT;

