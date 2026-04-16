#!/usr/bin/env node

const https = require('https');

// Environment variables from .env.local
const SUPABASE_URL = 'https://ashopwlwxtdwybtdixfy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM';

// SQL query to create the RLS policy
const SQL_QUERY = `CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

// Parse the URL
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/sql`);

// Create the request options
const options = {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  },
};

// Execute the SQL query using the Supabase REST API
const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('\n✓ RLS policy created successfully!');
    } else {
      console.log('\n✗ Failed to create RLS policy');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

// Send the SQL query
const payload = { query: SQL_QUERY };
req.write(JSON.stringify(payload));
req.end();
