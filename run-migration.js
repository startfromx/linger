const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Extract database URL from environment
// Supabase uses: postgresql://postgres:password@host:5432/postgres
// We need to extract this from the Supabase credentials

const supabaseUrl = 'https://ashopwlwxtdwybtdixfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM';

// For Supabase, the database URL is: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
// We don't have the direct password, so we'll use the service role key via API

const https = require('https');

async function executeSQL(sqlCommand) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ashopwlwxtdwybtdixfy.supabase.co',
      port: 443,
      path: '/functions/v1/sql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ sql: sqlCommand }));
    req.end();
  });
}

async function main() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260412_add_creator_insert_rls_policy.sql');
    const sqlCommand = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing SQL:');
    console.log(sqlCommand);
    console.log('\n---\n');

    const result = await executeSQL(sqlCommand);
    console.log('Success! Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
