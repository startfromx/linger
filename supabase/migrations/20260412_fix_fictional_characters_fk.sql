-- Migration to allow fictional characters without auth.users references
-- This removes the strict foreign key constraint and allows fictional characters
-- to be created with synthetic/generated user IDs

-- Drop the existing foreign key constraint on creator_profile
ALTER TABLE creator_profile
DROP CONSTRAINT "creator_profile_user_id_fkey";

-- Make user_id nullable to support fictional characters without auth accounts
ALTER TABLE creator_profile
ALTER COLUMN user_id DROP NOT NULL;

-- Remove the UNIQUE constraint so we can have fictional characters
ALTER TABLE creator_profile
DROP CONSTRAINT "creator_profile_user_id_key";

-- Optional: Add a more flexible foreign key that allows NULL
-- This maintains referential integrity for real users while allowing fictional characters
ALTER TABLE creator_profile
ADD CONSTRAINT "creator_profile_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Create an index for better performance on queries filtering by user_id
CREATE INDEX idx_creator_profile_user_id ON creator_profile(user_id) WHERE user_id IS NOT NULL;
