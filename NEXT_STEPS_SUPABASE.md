# 🚀 Next Steps: After Opening the SQL File

## ✅ Step-by-Step Guide

### Step 1: Copy the SQL Content

1. **In the SQL file** (`001_initial_schema.sql`):
   - Press **Cmd+A** (or Ctrl+A) to select ALL
   - Press **Cmd+C** (or Ctrl+C) to copy
   - You now have all 193 lines copied!

---

### Step 2: Go to Supabase Dashboard

1. **Open your browser**
2. **Go to:** https://supabase.com
3. **Sign in** (or create account if you haven't)
4. **Click on your project** (or create one if you haven't)

**If you haven't created a project yet:**
- Click **"New Project"**
- Fill in details:
  - Name: `Little Einstein`
  - Password: (choose strong password)
  - Region: (closest to you)
- Click **"Create new project"**
- Wait 2-3 minutes ⏳

---

### Step 3: Run the SQL Migration

1. **In Supabase dashboard**, look at the **left sidebar**
2. **Click on "SQL Editor"** (it has a code icon `</>`)
3. **Click "New query"** button (top right)
4. **Paste** your copied SQL (Cmd+V / Ctrl+V)
5. **Click "Run"** button (or press Cmd/Ctrl + Enter)
6. **Wait for success message** ✅

You should see:
- ✅ "Success. No rows returned"
- ✅ Or similar success message

**This creates all your tables!**

---

### Step 4: Get Your API Keys

1. **In Supabase**, go to **Settings** (gear icon ⚙️ in left sidebar)
2. **Click "API"** in the settings menu
3. **Copy these values:**

   **📋 Project URL:**
   - Looks like: `https://xxxxx.supabase.co`
   - Copy the entire URL

   **📋 anon public key:**
   - Under "Project API keys"
   - Label: `anon` `public`
   - Click the eye icon to reveal
   - Copy the long key (starts with `eyJ...`)

   **📋 service_role secret key:**
   - Label: `service_role` `secret`
   - ⚠️ Keep this secret! Never share it!
   - Copy the long key (starts with `eyJ...`)

---

### Step 5: Add Keys to .env.local

1. **Open your `.env.local` file** in your editor
   - It's in the root of your project
   - Same folder as `package.json`

2. **Add your Supabase keys:**

```env
# Your existing OpenAI key (already there)
OPENAI_API_KEY=sk-proj-...

# Add these Supabase keys:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Already there
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace:**
- `https://xxxxx.supabase.co` with your actual Project URL
- `eyJ...` with your actual keys

3. **Save the file** (Cmd+S / Ctrl+S)

---

### Step 6: Configure Authentication URLs

1. **In Supabase**, go to **Authentication** (left sidebar)
2. **Click "URL Configuration"**
3. **Add these:**

   **Site URL:**
   ```
   http://localhost:3000
   ```

   **Redirect URLs:** (click "Add URL" for each)
   ```
   http://localhost:3000/dashboard
   http://localhost:3000/auth/callback
   ```

4. **Click "Save"** ✅

---

### Step 7: Restart Your Server

1. **Stop your current server:**
   - Go to the terminal where `npm run dev` is running
   - Press **Ctrl+C** to stop it

2. **Restart the server:**
   ```bash
   npm run dev
   ```

3. **Wait for it to start** (you'll see "Ready" message)

---

### Step 8: Test Everything! 🎉

1. **Open browser:** http://localhost:3000

2. **Sign Up:**
   - Click "Sign Up"
   - Enter your email and password
   - Click "Sign Up"
   - You should be redirected to the dashboard! ✅

3. **Test Features:**
   - Create a task
   - Try AI Coach (generate a daily plan)
   - Add a habit
   - Everything should work!

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
- ❌ Migration didn't run successfully
- ✅ Go back to Step 3, check for errors in SQL Editor
- ✅ Make sure you copied ALL the SQL

### Error: "Invalid API key"
- ❌ Wrong keys in `.env.local`
- ✅ Go back to Step 4, double-check you copied the right keys
- ✅ Make sure there are no extra spaces

### Error: "Auth redirect URL mismatch"
- ❌ Authentication URLs not configured
- ✅ Go back to Step 6, make sure URLs are added

### App still shows errors
- ✅ Make sure you **restarted the server** after adding keys
- ✅ Check your `.env.local` file is saved
- ✅ Look at browser console (F12) for specific errors

---

## ✅ Checklist

Before you're done, make sure:

- [ ] SQL migration ran successfully
- [ ] Copied Project URL
- [ ] Copied anon key
- [ ] Copied service_role key
- [ ] Added all keys to `.env.local`
- [ ] Configured authentication URLs
- [ ] Restarted the dev server
- [ ] Can sign up/login
- [ ] Can access dashboard

---

**Ready? Start with Step 1 - Copy the SQL!** 📋

