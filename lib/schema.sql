-- Creator profiles
CREATE TABLE creator_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  age INTEGER,
  city VARCHAR(100),
  bio TEXT,
  profile_photo_url VARCHAR(500),
  gallery_urls TEXT[] DEFAULT '{}',
  personality_tags TEXT[] DEFAULT '{}',
  voice_fingerprint JSONB,
  topics_off_limits TEXT[] DEFAULT '{}',
  bank_name VARCHAR(100),
  bank_account VARCHAR(100),
  telegram_chat_id VARCHAR(100),
  is_fictional BOOLEAN DEFAULT false,
  creator_settings JSONB,
  merged_fingerprint_from_sources BOOLEAN DEFAULT false,
  source_count INTEGER DEFAULT 0,
  personality_profile JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Male profiles
CREATE TABLE male_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  credits_balance INTEGER DEFAULT 50,
  is_beta BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  man_id UUID NOT NULL REFERENCES male_profile(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Twin corrections (for trainer feedback)
CREATE TABLE twin_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  original_message TEXT NOT NULL,
  correction TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Creator personality data sources (WhatsApp, YouTube, Podcast, etc)
CREATE TABLE creator_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('whatsapp', 'youtube', 'podcast', 'generic')),
  source_name VARCHAR(255),
  uploaded_text TEXT NOT NULL,
  extracted_messages_count INTEGER,
  speaker_detected VARCHAR(255),
  fingerprint JSONB,
  confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_creator ON conversations(creator_id);
CREATE INDEX idx_conversations_man ON conversations(man_id);
CREATE INDEX idx_conversations_active ON conversations(is_active);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_twin_corrections_creator ON twin_corrections(creator_id);
CREATE INDEX idx_creator_sources_creator ON creator_sources(creator_id);
CREATE INDEX idx_creator_sources_type ON creator_sources(source_type);

-- Enable Row Level Security
ALTER TABLE creator_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE male_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Creators can only see/edit their own profile
CREATE POLICY "creators_view_own" ON creator_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "creators_edit_own" ON creator_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- Men can only see/edit their own profile
CREATE POLICY "men_view_own" ON male_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "men_edit_own" ON male_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can read creator profiles (for discovery)
CREATE POLICY "anyone_read_creator" ON creator_profile
  FOR SELECT USING (true);

-- Men can see conversations they're part of
CREATE POLICY "men_view_conversations" ON conversations
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM male_profile WHERE id = man_id));

-- Creators can see conversations they're part of
CREATE POLICY "creators_view_conversations" ON conversations
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM creator_profile WHERE id = creator_id));

-- Men and Creators can see messages in their conversations
CREATE POLICY "users_view_messages" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM male_profile WHERE id = (SELECT man_id FROM conversations WHERE id = conversation_id)
      UNION
      SELECT user_id FROM creator_profile WHERE id = (SELECT creator_id FROM conversations WHERE id = conversation_id)
    )
  );

-- Authenticated users can create their own creator profile
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can insert messages
CREATE POLICY "users_insert_messages" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    conversation_id IN (
      SELECT id FROM conversations WHERE
        man_id = (SELECT id FROM male_profile WHERE user_id = auth.uid())
        OR creator_id = (SELECT id FROM creator_profile WHERE user_id = auth.uid())
    )
  );
