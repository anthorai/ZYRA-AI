# Supabase Schema Cache Issue - Fix Guide

## Problem
The `sync_history` table exists in your Supabase database, but Supabase's PostgREST API layer hasn't refreshed its schema cache to recognize it. This causes the error:
```
Could not find the table 'public.sync_history' in the schema cache
```

## Impact
- Shopify product sync **will work** but won't record audit history
- You'll see warnings in the logs but sync will continue
- No compliance/audit trail until this is fixed

## Solution

### Option 1: Run SQL Command (Recommended - Quick)

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** (in the left sidebar)
4. Paste this command and click **Run**:

```sql
NOTIFY pgrst, 'reload schema';
```

5. Done! The schema cache is now refreshed.

### Option 2: Restart Your Supabase Project

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **General**  
3. Click **Restart project**
4. Wait for the restart to complete (2-3 minutes)

## Verification

After completing either option, check the application logs. You should see:
```
✅ [SHOPIFY SYNC] Created sync history record: <id>
```

Instead of:
```
⚠️  [SHOPIFY SYNC] CRITICAL: Failed to create sync history record
```

## Why This Happened

The `sync_history` table was created in your Supabase database, but PostgREST (the API layer that Supabase uses) caches the database schema for performance. When new tables are added, you need to manually reload the cache or restart the project.

## Prevention

In the future, when adding new tables to Supabase:
1. Always reload the schema cache after creating tables
2. Or use Supabase's Table Editor UI which automatically handles this
3. Or restart the project after running migrations

## Technical Details

- The application now gracefully handles this issue by logging warnings but continuing to sync
- Sync history is optional and won't block product synchronization
- Once the cache is reloaded, sync history will automatically start recording again
