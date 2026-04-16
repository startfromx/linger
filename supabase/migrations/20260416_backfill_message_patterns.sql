-- Backfill all existing creators with message_length_pattern and reply_frequency_pattern
-- Based on their existing writing_style and personality data

UPDATE creator_profile
SET personality_profile = jsonb_set(
  COALESCE(personality_profile, '{}'),
  '{voice_fingerprint,reply_frequency_pattern}',
  '"single"'::jsonb
)
WHERE personality_profile IS NOT NULL
  OR personality_profile->>'voice_fingerprint' IS NOT NULL;

-- Set message_length_pattern based on writing_style
UPDATE creator_profile
SET personality_profile = jsonb_set(
  COALESCE(personality_profile, '{}'),
  '{voice_fingerprint,message_length_pattern}',
  CASE
    WHEN personality_profile->'voice_fingerprint'->>'writing_style' IN ('detailed', 'conversational') THEN '"long"'::jsonb
    WHEN personality_profile->'voice_fingerprint'->>'writing_style' = 'concise' THEN '"short"'::jsonb
    WHEN personality_profile->'voice_fingerprint'->>'writing_style' IN ('expressive', 'thoughtful') THEN '"long"'::jsonb
    ELSE '"medium"'::jsonb
  END
)
WHERE personality_profile IS NOT NULL
  AND personality_profile->>'voice_fingerprint' IS NOT NULL;

-- For creators without voice_fingerprint, create one with defaults
UPDATE creator_profile
SET personality_profile = jsonb_set(
  COALESCE(personality_profile, '{}'),
  '{voice_fingerprint}',
  jsonb_build_object(
    'writing_style', 'thoughtful',
    'emotional_tone', 'balanced',
    'humor_style', 'subtle or dry',
    'vocabulary_level', 'casual',
    'conversational_patterns', 'expressive and open',
    'values', '[]'::jsonb,
    'interests', '[]'::jsonb,
    'example_messages', '[]'::jsonb,
    'confidence_scores', jsonb_build_object('overall', 0, 'writing_style', 0, 'emotional_tone', 0, 'vocabulary_level', 0),
    'message_length_pattern', 'medium',
    'reply_frequency_pattern', 'single'
  )
)
WHERE personality_profile IS NULL
  OR personality_profile->>'voice_fingerprint' IS NULL;
