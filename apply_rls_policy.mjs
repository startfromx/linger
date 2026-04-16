#!/usr/bin/env node

import fetch from 'node-fetch';

const PROJECT_ID = 'ashopwlwxtdwybtdixfy';
const SUPABASE_URL = 'https://ashopwlwxtdwybtdixfy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iswicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM';

async function executeSQL(sql) {
  console.log('Attempting to execute SQL via REST API...\n');
  console.log('SQL:', sql, '\n');

  // Try approach 1: Using the pgsql-rest endpoint (if available)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute`, {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTk1NzYsImV4cCI6MjA5MDY5NTU3Nn0.jGz2vbf1WyP7cP5dYcTXM6A7-ZLpQV_5ZMIGjlyhyIg',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_sql: sql })
    });

    console.log('Response Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

    if (response.ok) {
      console.log('\n✓ SQL executed successfully!');
      return true;
    }
  } catch (error) {
    console.log('Approach 1 failed:', error.message);
  }

  // Try approach 2: Using pg extension (if available)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTk1NzYsImV4cCI6MjA5MDY5NTU3Nn0.jGz2vbf1WyP7cP5dYcTXM6A7-ZLpQV_5ZMIGjlyhyIg',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });

    console.log('\nApproach 2 - Response Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

    if (response.ok) {
      console.log('\n✓ SQL executed successfully!');
      return true;
    }
  } catch (error) {
    console.log('Approach 2 failed:', error.message);
  }

  console.log('\n✗ Could not execute SQL via REST API');
  console.log('To apply the RLS policy, please:');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_ID + '/sql/new');
  console.log('2. Paste the SQL from supabase/migrations/20260412_add_creator_insert_rls_policy.sql');
  console.log('3. Click "Run"');

  return false;
}

const sql = `CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

executeSQL(sql).then(success => {
  process.exit(success ? 0 : 1);
});
