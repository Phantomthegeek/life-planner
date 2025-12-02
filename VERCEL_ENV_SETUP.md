# 🔧 Vercel Environment Variables Setup Guide

## ⚠️ Critical: Set These Environment Variables

Your app **requires** these environment variables to work. Without them, you'll see errors like:
```
Error: Missing Supabase environment variables...
```

---

## 📋 Required Environment Variables

Go to your Vercel project dashboard and add these:

### 1. Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Where to find:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. OpenAI Configuration

```
OPENAI_API_KEY=your_openai_api_key
```

**Where to find:**
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key (or use existing)
3. Copy it → `OPENAI_API_KEY`

### 3. App URL Configuration

```
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
```

**How to get:**
- After your first deployment, Vercel gives you a URL like: `https://life-planner-abc123.vercel.app`
- Use that exact URL (or your custom domain if you have one)

---

## 🚀 Step-by-Step Setup in Vercel

### Step 1: Access Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Each Variable

For each variable above:
1. Click **Add New**
2. Enter the **Name** (exactly as shown, case-sensitive)
3. Enter the **Value**
4. Select **Environment**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional, for local dev)
5. Click **Save**

### Step 3: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or just push a new commit to trigger auto-deploy

---

## ✅ Verification Checklist

After setting up, verify:

- [ ] All 5 environment variables are set in Vercel
- [ ] Variables are available for **Production** environment
- [ ] Deployment completed successfully
- [ ] No errors in Vercel logs
- [ ] App loads without Supabase errors
- [ ] Login/signup works

---

## 🔍 How to Check if Variables Are Set

### In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. You should see all 5 variables listed

### In Vercel Logs:
1. Go to **Deployments** → Click on a deployment → **Logs**
2. Look for any "Missing environment variable" errors

### In Your App:
- If you see Supabase errors → variables not set correctly
- If app loads but auth doesn't work → check Supabase URL configuration

---

## 🆘 Troubleshooting

### Error: "Missing Supabase environment variables"

**Solution:**
1. Verify variables are set in Vercel dashboard
2. Check variable names are **exactly** correct (case-sensitive)
3. Make sure they're enabled for **Production** environment
4. Redeploy after adding variables

### Error: "Invalid API key" or "Unauthorized"

**Solution:**
1. Double-check you copied the **entire** key (no spaces, no line breaks)
2. For Supabase: Make sure you're using the **anon** key, not service_role
3. For OpenAI: Verify the key is active and has credits

### App works locally but not on Vercel

**Solution:**
1. Local `.env.local` file doesn't work on Vercel
2. You **must** set variables in Vercel dashboard
3. Variables in `.env.local` are only for local development

---

## 📝 Example Values (Don't Use These!)

These are just examples of what the values look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.example
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890
NEXT_PUBLIC_APP_URL=https://life-planner-abc123.vercel.app
```

**⚠️ Important:** Use your **actual** values from your Supabase and OpenAI accounts!

---

## 🔐 Security Notes

- ✅ Environment variables in Vercel are encrypted
- ✅ They're only accessible to your project
- ✅ Never commit `.env` files to Git (they're in `.gitignore`)
- ✅ Never share your API keys publicly
- ✅ Rotate keys if they're accidentally exposed

---

## 🎯 Quick Reference

**Minimum Required Variables:**
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `OPENAI_API_KEY`
5. `NEXT_PUBLIC_APP_URL`

**After Setting:**
- Redeploy your app
- Test authentication
- Check Vercel logs for errors

---

**That's it! Once these are set, your app should work perfectly! 🎉**

