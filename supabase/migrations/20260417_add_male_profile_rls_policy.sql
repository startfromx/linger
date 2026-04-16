-- Enable RLS on male_profile table
ALTER TABLE male_profile ENABLE ROW LEVEL SECURITY;

-- Allow users to INSERT their own profile
CREATE POLICY "users_insert_own_profile" ON male_profile
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Allow users to SELECT their own profile
CREATE POLICY "users_select_own_profile" ON male_profile
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Allow users to UPDATE their own profile
CREATE POLICY "users_update_own_profile" ON male_profile
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- Allow visitors to read male_profile (for conversations, etc.)
CREATE POLICY "allow_read_male_profile" ON male_profile
  FOR SELECT USING (true);
