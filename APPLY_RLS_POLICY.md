# Apply RLS Policy for Creator Profile Inserts

## Problem
The character creation feature was failing because authenticated users didn't have permission to insert rows into the `creator_profile` table. This was an RLS (Row Level Security) policy issue.

## Solution
Add an INSERT RLS policy to the `creator_profile` table that allows authenticated users to insert new rows.

## Status
✓ The RLS policy has been added to:
- `/lib/schema.sql` (lines 138-140)
- `/supabase/migrations/20260412_add_creator_insert_rls_policy.sql` (migration file)

## How to Apply

### Option 1: Manual Application via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy/sql/new

2. Open the SQL Editor (or navigate to SQL > New Query)

3. Copy and paste this SQL command:
   ```sql
   CREATE POLICY "authenticated_insert_creator" ON creator_profile
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   ```

4. Click the "Run" button to execute the query

5. You should see a success message

6. The policy is now applied and character creation should work!

### Option 2: Via Database URL (Advanced)

If you have access to the database connection string, you can execute the SQL directly:

```bash
# Export your database URL
export DATABASE_URL="postgresql://postgres:[password]@ashopwlwxtdwybtdixfy.supabase.co:5432/postgres"

# Execute the SQL
psql "$DATABASE_URL" << 'EOF'
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EOF
```

### Option 3: Via Migration File

The migration file is located at:
- `/supabase/migrations/20260412_add_creator_insert_rls_policy.sql`

This can be applied through Supabase's migration system if configured.

## Verification

After applying the policy, test the character creation feature:

1. Go to the Linger app
2. Create a new character profile
3. The form should now submit successfully without RLS errors

You can also verify in the Supabase dashboard:
- Go to Authentication > Policies
- Look for the table `creator_profile`
- You should see the policy `"authenticated_insert_creator"` listed with:
  - Type: INSERT
  - Condition: `auth.role() = 'authenticated'`

## What This Policy Does

The policy `"authenticated_insert_creator"` on the `creator_profile` table:
- **Allows**: Any authenticated user to INSERT new rows into `creator_profile`
- **Requirement**: The user must be authenticated (have a valid session)
- **No additional checks**: Unlike SELECT and UPDATE policies, this one doesn't verify user_id

This is safe because:
- Users can only insert when authenticated
- The application enforces that the `user_id` matches the current user
- Row-level ownership is enforced through application logic

## Related Files

- Schema definition: `/lib/schema.sql` (lines 1-23)
- Migration: `/supabase/migrations/20260412_add_creator_insert_rls_policy.sql`
- API endpoint (for testing): `/app/api/admin/execute-sql/route.ts`

## Troubleshooting

If you get an error like "duplicate key value violates unique constraint":
- This means the policy was already created - that's fine!

If you get "permission denied for schema public":
- Make sure you're using the Service Role key with admin access
- The Supabase dashboard should handle this automatically

If character creation still fails:
- Check the browser console for specific error messages
- Verify the policy was created by checking the Policies tab in Supabase
- Make sure the app is using the correct Supabase URL and keys from `.env.local`
