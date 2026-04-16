# Manual RLS Policy Application Guide

## Quick Reference

**What**: Apply an INSERT RLS policy to allow authenticated users to create character profiles  
**Where**: Supabase Dashboard SQL Editor  
**Time**: 2-3 minutes  
**SQL to Run**:
```sql
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

---

## Step-by-Step Instructions

### Step 1: Open the Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy/sql**
2. Log in if prompted
3. You should see the SQL Editor interface

### Step 2: Create a New Query

Option A (Recommended):
- Click the **"New query"** button in the SQL section

Option B:
- Navigate directly to: `https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy/sql/new`

### Step 3: Copy the SQL Statement

Copy this entire SQL statement:

```sql
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Step 4: Paste into the Editor

1. Click in the SQL editor (the text area)
2. Paste the SQL (Cmd+V on Mac, Ctrl+V on Windows/Linux)
3. You should see the SQL appear in the editor

### Step 5: Execute the Query

1. Look for the **"Run"** button (usually in the top-right corner, blue button)
2. Click **"Run"** to execute the SQL
3. Wait for the query to complete (usually takes 1-2 seconds)

### Step 6: Verify Success

You should see one of these messages:

✅ **Success Message**:
```
Query executed successfully
```

Or check the "Execution Details" panel for confirmation.

### Step 7: Verify the Policy Was Created

1. In the Supabase dashboard, go to: **Authentication > Policies**
2. Select table: **creator_profile**
3. Look for a policy named: **"authenticated_insert_creator"**
4. Verify it shows:
   - **Type**: INSERT
   - **Using**: `auth.role() = 'authenticated'`

---

## What Happens Next

After you apply the policy:

1. **The policy is immediately active** - no restart needed
2. **Character creation should now work** in the Linger app
3. **Users can insert creator profiles** when authenticated
4. **The app continues to work normally** - nothing else changes

---

## If Something Goes Wrong

### Error: "Policy already exists"

```
ERROR: Duplicate policy name
```

**What it means**: The policy was already created (perhaps in a previous session)  
**What to do**: This is fine! The policy is already active. You can skip to testing.  
**Action**: Go to Step 7 (Verify) to confirm it exists.

### Error: "Access denied" or "Permission denied"

```
ERROR: Permission denied for schema public
ERROR: Must be superuser
```

**What it means**: You don't have admin access  
**What to do**: Make sure you're logged into Supabase with the correct account  
**Action**: Log out and log back in, then try again.

### Error: "Table does not exist"

```
ERROR: Relation "creator_profile" does not exist
```

**What it means**: The table name is wrong or doesn't exist  
**What to do**: Verify the table name is `creator_profile` (case-sensitive)  
**Action**: Check the schema in your database to confirm.

### Nothing Happens When I Click "Run"

**What to try**:
1. Refresh the page (Cmd+R / Ctrl+R)
2. Clear browser cache
3. Try a different browser (Safari, Firefox, Chrome)
4. Check if you're logged in to Supabase

---

## Testing the Policy Works

After applying the policy, test character creation:

### Test 1: Via Browser App

1. Go to the Linger app: `http://localhost:3000`
2. Navigate to character creation
3. Fill out the form
4. Click "Create" or "Submit"
5. Character should be created successfully ✓

### Test 2: Via API (curl)

```bash
curl -X POST http://localhost:3000/api/admin/characters \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Test Character",
    "age": 25
  }'
```

Should return success (not an RLS error).

---

## Important Notes

### ✅ Safe Operations
- This policy **only allows INSERT** (new character creation)
- Users cannot **SELECT** other users' data (controlled by separate policies)
- Users cannot **UPDATE** or **DELETE** data (other policies)
- Anonymous users **cannot insert** (requires authentication)

### 🔒 Security
- The policy requires valid Supabase authentication
- The app layer validates that user_id matches the current user
- This follows Supabase best practices

### 📝 Verification
- You can check the policy exists in the Supabase UI
- Go to: Authentication > Policies > creator_profile table
- Look for: "authenticated_insert_creator" policy

---

## Troubleshooting Checklist

- [ ] Logged into Supabase dashboard?
- [ ] In the correct project (ashopwlwxtdwybtdixfy)?
- [ ] In the SQL Editor section?
- [ ] SQL pasted correctly (no typos)?
- [ ] Clicked "Run" button?
- [ ] Saw success message or no error?
- [ ] Policy appears in Policies list?
- [ ] Character creation works in app?

---

## Additional Resources

- **Full Report**: `/RLS_POLICY_IMPLEMENTATION_REPORT.md`
- **Status Report**: `/RLS_POLICY_STATUS_REPORT.md`
- **Schema File**: `/lib/schema.sql`
- **Supabase Docs**: https://supabase.com/docs/guides/auth/row-level-security

---

## Still Need Help?

1. Check the Supabase logs for errors (Dashboard > Logs)
2. Verify the policy was created (Dashboard > Authentication > Policies)
3. Test with the curl command above
4. Check app console logs for RLS-related errors
5. Review the full RLS implementation report

---

**Created**: April 12, 2026  
**Last Updated**: April 12, 2026  
**Status**: Ready to apply
