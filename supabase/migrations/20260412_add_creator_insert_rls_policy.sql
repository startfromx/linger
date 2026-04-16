-- Add INSERT RLS policy for authenticated users to create creator profiles
-- This fixes the character creation issue by allowing authenticated users to insert rows

CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
