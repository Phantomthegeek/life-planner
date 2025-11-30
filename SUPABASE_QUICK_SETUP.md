# 🚀 Quick Supabase Setup Guide

Follow these steps to get Supabase working:

## Step 1: Create Supabase Account & Project

1. **Go to:** https://supabase.com
2. **Sign up** (free account works!)
3. **Click "New Project"**
4. **Fill in:**
   - Organization: Create one or use existing
   - Project Name: `Little Einstein` (or any name)
   - Database Password: **Choose a strong password** ⚠️ (save this!)
   - Region: Choose closest to you
   - Pricing Plan: **Free tier** is fine
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for project to be created

## Step 2: Run Database Migration

1. **In your Supabase project dashboard**, click **"SQL Editor"** in the left sidebar
2. **Click "New query"**
3. **Open this file:** `supabase/migrations/001_initial_schema.sql`
4. **Copy ALL the contents** (193 lines)
5. **Paste into the SQL Editor**
6. **Click "Run"** (or press Cmd/Ctrl + Enter)
7. **Wait for success message** ✅

This creates all your tables (users, tasks, habits, certifications, etc.)

## Step 3: Get Your API Keys

1. **In Supabase dashboard**, go to **Settings** (gear icon) → **API**
2. **Copy these values:**

   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role secret** key (starts with `eyJ...`) ⚠️ Keep this secret!

## Step 4: Add Keys to .env.local

Add these lines to your `.env.local` file:

```env
# Your existing OpenAI key (already there)
OPENAI_API_KEY=sk-proj-...

# Add these Supabase keys:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Configure Authentication URLs

1. **In Supabase**, go to **Authentication** → **URL Configuration**
2. **Add Site URL:** `http://localhost:3000`
3. **Add Redirect URLs:**
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`
4. **Click "Save"**

## Step 6: Restart Your Server

Stop your current server (Ctrl+C) and restart:
```bash
npm run dev
```

## Step 7: Test It!

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create an account
4. You should be redirected to the dashboard! 🎉

---

## 🆘 Need Help?

- **Can't find SQL Editor?** Look in the left sidebar
- **Migration failed?** Make sure you copied the entire SQL file
- **Can't find API keys?** Settings → API
- **Error after restart?** Check your `.env.local` keys are correct

---

**Ready? Start with Step 1!** 🚀

