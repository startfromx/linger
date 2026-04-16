import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ashopwlwxtdwybtdixfy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM';

// Create client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createRLSPolicy() {
  console.log('Creating RLS policy for creator_profile table...\n');

  const sql = `CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return false;
    }

    console.log('✓ RLS policy created successfully!');
    console.log('Response:', data);
    return true;
  } catch (err) {
    console.error('Exception:', err.message);
    return false;
  }
}

createRLSPolicy().then(success => {
  process.exit(success ? 0 : 1);
});
