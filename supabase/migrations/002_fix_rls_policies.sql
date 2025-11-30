-- Fix RLS policies for certifications and modules
-- Run this in Supabase SQL Editor if you get "new row violates policy" errors

-- Allow authenticated users to insert certifications
CREATE POLICY "Authenticated users can insert certifications"
ON public.certifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update certifications (optional - for future edits)
CREATE POLICY "Authenticated users can update certifications"
ON public.certifications
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to insert cert modules
CREATE POLICY "Authenticated users can insert cert modules"
ON public.cert_modules
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update cert modules
CREATE POLICY "Authenticated users can update cert modules"
ON public.cert_modules
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete cert modules
CREATE POLICY "Authenticated users can delete cert modules"
ON public.cert_modules
FOR DELETE
TO authenticated
USING (true);

