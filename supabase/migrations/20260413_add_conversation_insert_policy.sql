-- Allow visitors (men) to INSERT conversations they're part of
CREATE POLICY "men_insert_conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM male_profile WHERE id = man_id)
  );

-- Allow creators to INSERT conversations they're part of
CREATE POLICY "creators_insert_conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM creator_profile WHERE id = creator_id)
  );
