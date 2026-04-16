# RLS Policy Application - Step-by-Step Instructions

## Quick Summary
The character creation is failing because authenticated users need INSERT permission on the `creator_profile` table. A new RLS policy has been prepared to fix this.

## Required SQL Policy
```sql
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Files Modified/Created
1. ✓ `/lib/schema.sql` - Added policy (lines 138-140)
2. ✓ `/supabase/migrations/20260412_add_creator_insert_rls_policy.sql` - Migration file
3. ✓ `/APPLY_RLS_POLICY.md` - Detailed guide
4. ✓ `/app/api/admin/execute-sql/route.ts` - Backend endpoint (informational)

## How to Apply (MANUAL - Required)

### Step 1: Open Supabase Dashboard
- URL: https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy

### Step 2: Navigate to SQL Editor
- Click on "SQL Editor" in the left sidebar
- Or go directly to: https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy/sql/new

### Step 3: Paste the SQL
Copy and paste this exact SQL into the editor:
```sql
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Step 4: Execute
- Click the blue "Run" button in the bottom right
- Wait for confirmation message

### Step 5: Verify Success
You should see a message like "Query executed successfully"

### Step 6: Test Character Creation
1. Go back to the Linger app
2. Try creating a new character
3. The form should now submit successfully!

## Verification in Dashboard

After applying, verify the policy exists:
1. Go to Authentication > Policies
2. Search for table: `creator_profile`
3. You should see:
   - Policy Name: `"authenticated_insert_creator"`
   - Type: INSERT
   - Using expression: `auth.role() = 'authenticated'`

## What This Fixes

Currently, when users try to create a character, they get an error like:
- "new row violates row-level security policy"
- "Policy breach on INSERT"
- "Permission denied"

This is because the `creator_profile` table has RLS enabled but no INSERT policy for authenticated users.

The new policy allows:
- ✓ Authenticated users to insert rows
- ✓ The application layer to control which user_id gets assigned
- ✗ Anonymous users cannot insert (must be authenticated)

## Why This Is Safe

1. **User Authentication Required**: Only users with valid auth tokens can use this policy
2. **No Data Leakage**: The policy doesn't allow reading other users' data
3. **Application-Level Enforcement**: The app still validates that user_id matches the current session
4. **Minimal Scope**: Only allows INSERT, not SELECT, UPDATE, or DELETE

## If You Encounter Issues

**Error: "Policy already exists"**
- The policy was already created - that's fine!
- Proceed to test character creation

**Error: "Permission denied"**
- Make sure you're signed in as a Supabase admin
- The dashboard should have sufficient permissions

**Character creation still fails**
- Check browser console (F12) for specific error messages
- Verify the app is using the correct `.env.local` configuration
- Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

**Can't access SQL Editor**
- Your Supabase project account may not have sufficient permissions
- Contact the project owner to apply this policy

## Related Documentation

- See `/APPLY_RLS_POLICY.md` for more detailed information
- Schema definition: `/lib/schema.sql`
- Character creation API: `/app/api/admin/characters/route.ts`

## Timeline

- **Created**: April 12, 2026
- **Target Application**: Supabase dashboard SQL editor
- **Expected Completion Time**: 5 minutes

---

**Status**: Ready for manual application in Supabase dashboard
