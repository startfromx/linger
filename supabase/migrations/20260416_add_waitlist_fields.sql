-- Add waitlist fields to male_profile table
ALTER TABLE male_profile
ADD COLUMN waitlist_email VARCHAR(255),
ADD COLUMN seen_out_of_credits_modal BOOLEAN DEFAULT false;

-- Index for waitlist lookups
CREATE INDEX idx_male_profile_waitlist_email ON male_profile(waitlist_email);
