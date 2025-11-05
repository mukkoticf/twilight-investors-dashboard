-- =====================================================
-- SUPABASE STORAGE POLICIES FOR AGREEMENT_FILE BUCKET
-- =====================================================
-- These policies allow authenticated users to upload and read agreement files

-- =====================================================
-- POLICY 1: Allow authenticated users to upload files
-- =====================================================
-- This allows any logged-in user (admin or investor) to upload files
-- You can restrict this to admin only if needed

CREATE POLICY "Allow authenticated users to upload agreements"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agreement_file'
);

-- =====================================================
-- POLICY 2: Allow authenticated users to read/download files
-- =====================================================
-- This allows any logged-in user to view/download agreements

CREATE POLICY "Allow authenticated users to read agreements"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreement_file'
);

-- =====================================================
-- POLICY 3: Allow authenticated users to update files
-- =====================================================
-- This allows replacing/updating existing agreement files
-- Useful if admin wants to upload a new version

CREATE POLICY "Allow authenticated users to update agreements"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agreement_file'
)
WITH CHECK (
  bucket_id = 'agreement_file'
);

-- =====================================================
-- POLICY 4: Allow authenticated users to delete files (optional)
-- =====================================================
-- Uncomment if you want to allow deleting agreements
-- CREATE POLICY "Allow authenticated users to delete agreements"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'agreement_file'
-- );

-- =====================================================
-- ALTERNATIVE: RESTRICT UPLOAD TO ADMIN ONLY
-- =====================================================
-- If you want only admins to upload, use this instead of Policy 1:
-- 
-- DROP POLICY IF EXISTS "Allow authenticated users to upload agreements" ON storage.objects;
-- 
-- CREATE POLICY "Allow admin to upload agreements"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'agreement_file' AND
--   (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@mail.com', 'admin@investor.com')
-- );

