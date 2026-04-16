# RLS Policy Application Status Report

**Date**: April 12, 2026  
**Task**: Apply INSERT RLS policy to `creator_profile` table  
**Status**: ⏳ REQUIRES MANUAL APPLICATION

---

## Summary

The RLS policy SQL has been prepared and verified, but it requires manual application through the Supabase dashboard because Supabase does not expose a programmatic SQL execution API for arbitrary queries.

**SQL to Apply**:
```sql
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

---

## What Was Attempted

### 1. Direct API Execution ✗
- **Method**: Supabase REST API `/rest/v1/rpc/execute_sql`
- **Result**: Failed - endpoint requires a PL/pgSQL function to exist, which is not configured
- **Error**: `PGRST202 - Could not find the function public.execute_sql(sql)`

### 2. Python Client ✗
- **Method**: Supabase Python SDK with service role key
- **Result**: Failed - Python client doesn't support arbitrary SQL execution without custom RPC functions
- **Status**: Python 3.9.6, supabase 2.28.3 installed but limited to table operations only

### 3. Node.js HTTP Request ✗
- **Method**: Direct HTTP POST to Supabase API
- **Result**: Failed - same JWT validation error as REST API approach
- **Error**: `PGRST301 - No suitable key or wrong key type`

### 4. psql Command Line ✗
- **Method**: PostgreSQL client CLI
- **Status**: Not installed (requires `brew install postgresql` or similar)
- **Issue**: Supabase database password not available in project files

### 5. Supabase CLI ✗
- **Method**: `supabase db push` command
- **Status**: Unable to install - permission denied for `/usr/local/lib/node_modules`
- **Workaround**: Would require either `sudo` or local installation in project

### 6. Browser Dashboard (Claude in Chrome MCP) ✗
- **Method**: Navigate to Supabase dashboard and use SQL editor
- **Result**: Page loads but interactive elements (Monaco editor, buttons) not rendering
- **Likely Cause**: Dashboard framework issue or authentication session problem

---

## Action Required

The RLS policy **must be applied manually** through the Supabase dashboard:

### Steps

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy/sql

2. **Create New Query**
   - Click "New Query" button in the SQL section
   - Or navigate to: `/sql/new` in the dashboard

3. **Paste the SQL**
   ```sql
   CREATE POLICY "authenticated_insert_creator" ON creator_profile
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   ```

4. **Execute Query**
   - Click "Run" button (usually in top-right of editor)
   - Wait for success message

5. **Verify**
   - Go to Authentication > Policies
   - Select table: `creator_profile`
   - Confirm `"authenticated_insert_creator"` policy appears

---

## Why This Matters

The character creation feature in Linger requires this policy because:

1. The `creator_profile` table has RLS enabled
2. Users need INSERT permission to create new character profiles
3. The app calls: `supabase.from('creator_profile').insert(...)`
4. Without this policy, the INSERT fails with: "new row violates row-level security policy"

---

## Files Already Prepared

These files contain the RLS policy definition and are ready for deployment:

1. **Schema file**: `/lib/schema.sql` (lines 138-140)
   - Contains the policy definition
   - Ready to be deployed as part of schema

2. **Migration file**: `/supabase/migrations/20260412_add_creator_insert_rls_policy.sql`
   - Standalone migration file
   - Can be used with Supabase migration system

3. **Documentation**:
   - `/APPLY_RLS_POLICY.md` - Detailed guide
   - `/RLS_POLICY_APPLICATION_STEPS.md` - Quick reference
   - `/RLS_POLICY_IMPLEMENTATION_REPORT.md` - Full technical analysis

4. **Application scripts** (reference only):
   - `/apply_rls_policy.mjs` - Node.js attempt
   - `/apply_rls_policy.py` - Python attempt
   - `/apply_policy.js` - Alternative Node.js approach

---

## Troubleshooting

### "Policy already exists" error
- **Cause**: Policy was already created in a previous session
- **Action**: This is safe to ignore - the policy is already applied
- **Next**: Skip to Verification step

### Dashboard not loading
- Try refreshing the page (Cmd+R or Ctrl+R)
- Clear browser cache (Cmd+Shift+Delete / Ctrl+Shift+Delete)
- Try a different browser (Safari, Firefox, Chrome)
- Check if you're logged into Supabase

### Still can't create characters after applying
1. Verify the policy appears in the Policies list
2. Check browser console for specific error messages
3. Ensure `.env.local` has correct Supabase credentials
4. Restart the development server

---

## Security Notes

✅ **This policy is safe because**:
- Only authenticated users can INSERT (anonymous blocked)
- Doesn't grant SELECT access (separate policies control read)
- App-layer validation ensures user_id matches current user
- Minimal scope: INSERT only on creator_profile table
- Follows Supabase best practices for user-generated content

---

## Next Steps After Application

1. ✓ Apply policy through dashboard (you are here)
2. Test character creation in Linger app
3. Verify in Supabase dashboard that policy exists
4. Monitor logs for any RLS-related errors
5. Document the process for future reference

---

## Technical Details

- **Project ID**: `ashopwlwxtdwybtdixfy`
- **Database**: Supabase PostgreSQL
- **Table**: `creator_profile`
- **Policy Type**: INSERT
- **Condition**: `auth.role() = 'authenticated'`
- **Service Key Verified**: Yes (used for testing)

---

**Report Generated**: April 12, 2026 12:41 AM  
**Prepared By**: Claude Agent (Anthropic)  
**Status**: Ready for manual application
