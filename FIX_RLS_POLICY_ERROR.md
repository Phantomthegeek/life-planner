# 🔧 Fix "new row violates policy" Error

## ⚠️ What's Wrong

You're getting this error because the Row Level Security (RLS) policies in Supabase don't allow inserting certifications or modules.

**Current policies:**
- ✅ Can **view** certifications (SELECT)
- ❌ Cannot **insert** certifications (INSERT)
- ❌ Cannot **insert** modules (INSERT)

## ✅ Fix: Add Missing Policies

### Step 1: Go to Supabase

1. Open your Supabase dashboard
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New query"**

### Step 2: Run This SQL

Copy and paste this SQL into the editor:

```sql
-- Allow authenticated users to insert certifications
CREATE POLICY "Authenticated users can insert certifications"
ON public.certifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update certifications
CREATE POLICY "Authenticated users can update certifications"
ON public.certifications
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to insert cert modules
CREATE POLICY "Authenticated users can insert cert modules"
ON public.cert_modules
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update cert modules
CREATE POLICY "Authenticated users can update cert modules"
ON public.cert_modules
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete cert modules
CREATE POLICY "Authenticated users can delete cert modules"
ON public.cert_modules
FOR DELETE
TO authenticated
USING (true);
```

### Step 3: Run It

1. Click **"Run"** button
2. Wait for success ✅

### Step 4: Test Again

Go back to your app and try:
- Adding a certification
- Adding modules
- Should work now! ✅

---

## 📋 Alternative: Quick Fix File

I've created a file with the fix:

**File:** `supabase/migrations/002_fix_rls_policies.sql`

1. Open that file
2. Copy all the SQL
3. Paste into Supabase SQL Editor
4. Run it

---

## 🔍 Why This Happened

The initial migration only added SELECT policies (to view data) but forgot to add INSERT/UPDATE/DELETE policies (to modify data).

This fix adds policies that allow authenticated users to:
- ✅ Insert certifications
- ✅ Update certifications
- ✅ Insert modules
- ✅ Update modules
- ✅ Delete modules

---

**Run the SQL fix and try again!** 🚀

