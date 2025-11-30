# 🔧 Complete Fix for "Failed to generate daily plan"

## ✅ What I Just Fixed

I improved error handling to show **specific error messages** instead of the generic one. Now you'll see what's actually wrong!

## 🔍 Most Likely Causes

### 1. OpenAI API Key Not Loaded ⚠️ **MOST COMMON**

**Problem:** The server was started BEFORE you added the OpenAI key to `.env.local`

**Fix:**
1. **Stop the server** (Ctrl+C in the terminal)
2. **Restart the server:**
   ```bash
   npm run dev
   ```
3. **Environment variables only load when the server starts!**

### 2. Invalid OpenAI API Key

**Problem:** The API key in `.env.local` is wrong or expired

**Fix:**
1. Check your OpenAI account: https://platform.openai.com/api-keys
2. Make sure the key in `.env.local` matches
3. Verify it starts with `sk-proj-...`
4. Restart server after fixing

### 3. No Credits/Quota on OpenAI Account

**Problem:** Your OpenAI account has no credits or exceeded quota

**Fix:**
1. Go to: https://platform.openai.com/account/usage
2. Check your usage and credits
3. Add credits if needed

### 4. Database Tables Missing

**Problem:** SQL migration not run, so user profile doesn't exist

**Fix:**
- Run SQL migration in Supabase (see other guides)

---

## 🧪 Step-by-Step Fix

### Step 1: Restart Your Server (IMPORTANT!)

**Environment variables only load on server start!**

1. **Stop server:** Go to terminal, press **Ctrl+C**
2. **Start server again:**
   ```bash
   npm run dev
   ```
3. **Wait for "Ready" message**

### Step 2: Verify API Key

```bash
# Check if key exists in file
cat .env.local | grep OPENAI
```

Should show: `OPENAI_API_KEY=sk-proj-...`

### Step 3: Test Again

1. **Refresh browser** (hard refresh: Cmd+Shift+R)
2. **Try "Generate Plan" again**
3. **Check the NEW error message** (will be specific now!)

---

## 📋 Quick Checklist

Before trying AI:

- [ ] OpenAI key in `.env.local`? ✅
- [ ] Server restarted after adding key? ⚠️ **Most likely issue!**
- [ ] Signed in to app?
- [ ] SQL migration run?
- [ ] OpenAI account has credits?

---

## 🎯 Most Likely Fix

**Restart your server!** 

The OpenAI key exists in `.env.local`, but if the server was started before you added it, it won't be loaded.

**Do this:**
1. Stop server (Ctrl+C)
2. Run `npm run dev`
3. Try AI again

---

## 🔍 Check Server Terminal

When you try to generate a plan, **look at your server terminal** (where `npm run dev` is running).

You should see:
- Error logs if something fails
- The actual OpenAI API error

**Share any errors from the terminal and I can help more!**

---

**Try restarting your server first - that's the most common fix!** 🚀

