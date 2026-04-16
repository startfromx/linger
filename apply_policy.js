#!/usr/bin/env node

const https = require('https');

const PROJECT_ID = 'ashopwlwxtdwybtdixfy';
const SUPABASE_URL = 'https://ashopwlwxtdwybtdixfy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTk1NzYsImV4cCI6MjA5MDY5NTU3Nn0.jGz2vbf1WyP7cP5dYcTXM6A7-ZLpQV_5ZMIGjlyhyIg';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM';

const sql = `CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

console.log('Attempting to apply RLS policy via Supabase REST API...\n');
console.log('SQL:', sql, '\n');

// Try to execute via the REST API
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`);

const postData = JSON.stringify({ sql });

const options = {
  method: 'POST',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);

    if (res.statusCode < 400 && data && !data.includes('PGRST') && !data.includes('Could not find')) {
      console.log('\n✓ Policy may have been created successfully!');
    } else if (res.statusCode === 404 || data.includes('Could not find')) {
      console.log('\n✗ SQL execution endpoint not available');
      console.log('\nTo apply the RLS policy manually:');
      console.log('1. Navigate to: https://supabase.com/dashboard/project/' + PROJECT_ID + '/sql/new');
      console.log('2. Paste this SQL command:');
      console.log('   ' + sql);
      console.log('3. Click "Run"');
      process.exit(1);
    } else if (res.statusCode >= 400) {
      console.log('\n✗ Request failed');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Connection Error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
