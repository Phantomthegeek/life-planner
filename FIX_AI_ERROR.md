# 🔧 Fix "Failed to generate plan" Error

## ✅ What I Just Fixed

I improved the error messages so you'll see the **actual problem** instead of just "Failed to generate plan".

## 🔍 Now Try Again

1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. **Click "Generate Plan" again**
3. **You should now see a specific error message**

## Common Errors & Fixes

### Error: "User profile not found" 

**This is the most common issue!**

**Problem:** Your user profile doesn't exist in the database yet.

**Fix:**

**Option 1: Run SQL Migration** (if not done)
1. Go to Supabase dashboard
2. SQL Editor → New Query
3. Copy ALL content from `supabase/migrations/001_initial_schema.sql`
4. Paste and Run
5. Refresh browser and try again

**Option 2: Create User Profile Manually** (if migration is run)
1. Sign up/login first (this should create the profile automatically)
2. If it still doesn't work, the trigger might not be set up
3. Run the SQL migration to create the trigger

---

### Error: "Unauthorized"

**Problem:** You're not logged in.

**Fix:**
1. Go to http://localhost:3000/login
2. Sign in or create account
3. Try again

---

### Error: "OpenAI API key..."

**Problem:** API key not working or missing.

**Fix:**
1. Check `.env.local` has `OPENAI_API_KEY=sk-proj-...`
2. Restart server (Ctrl+C, then `npm run dev`)
3. Try again

---

### Error: "Internal server error"

**Problem:** Something else went wrong.

**Check:**
1. Browser console (F12 → Console) for details
2. Server terminal for error logs
3. Share the error with me!

---

## 🎯 Most Likely Fix

**"User profile not found" means you need to run the SQL migration!**

### Quick Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Click on your project

2. **Open SQL Editor**
   - Left sidebar → "SQL Editor"
   - Click "New query"

3. **Run Migration**
   - Open `supabase/migrations/001_initial_schema.sql` in your editor
   - Select ALL (Cmd+A)
   - Copy (Cmd+C)
   - Paste into Supabase SQL Editor
   - Click "Run"

4. **Try AI Again**
   - Refresh browser
   - Click "Generate Plan"
   - Should work now! ✅

---

## 📋 Checklist

Before trying AI again:

- [ ] SQL migration run in Supabase?
- [ ] Signed in to the app?
- [ ] OpenAI key in `.env.local`?
- [ ] Server restarted after adding keys?

---

**Try generating a plan again - the new error message will tell you exactly what's wrong!** 🚀

