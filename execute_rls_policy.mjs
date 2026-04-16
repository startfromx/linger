import pkg from 'pg';
const { Client } = pkg;

async function createRLSPolicy() {
  const client = new Client({
    host: 'ashopwlwxtdwybtdixfy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'your-password-here', // This will need to be set
    ssl: true,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    const sql = `CREATE POLICY "authenticated_insert_creator" ON creator_profile
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

    const result = await client.query(sql);
    console.log('✓ RLS policy created successfully!');
    console.log('Result:', result);

    await client.end();
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

createRLSPolicy().then(success => {
  process.exit(success ? 0 : 1);
});
