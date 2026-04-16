-- Add personality_profile column to creator_profile table
-- This stores the unified personality profile with 28+ dimensions for all characters

ALTER TABLE creator_profile
ADD COLUMN personality_profile JSONB DEFAULT NULL;

-- Create index on personality_profile for efficient querying
CREATE INDEX idx_creator_profile_personality_profile ON creator_profile USING GIN (personality_profile);

-- Add comment for documentation
COMMENT ON COLUMN creator_profile.personality_profile IS 'Complete personality profile (CreatorPersonalityProfile) with all 28+ personality dimensions for unified character system';
