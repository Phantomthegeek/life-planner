# 🔧 AI Not Working - Troubleshooting Guide

## Common Issues & Fixes

### Issue 1: "User profile not found" Error

**Symptoms:**
- AI Coach button shows error
- Error message about user profile

**Cause:**
- You haven't run the SQL migration yet
- User profile table doesn't exist

**Fix:**
1. Go to Supabase dashboard
2. SQL Editor → New Query
3. Copy ALL content from `supabase/migrations/001_initial_schema.sql`
4. Paste and Run
5. Refresh browser and try again

---

### Issue 2: OpenAI API Key Not Loading

**Symptoms:**
- Error about API key
- "OpenAI API key not found"

**Fix:**
1. Check `.env.local` file exists in project root
2. Verify it has: `OPENAI_API_KEY=sk-proj-...`
3. **Restart your dev server** (Ctrl+C, then `npm run dev`)
4. Environment variables only load when server starts!

---

### Issue 3: Database Tables Don't Exist

**Symptoms:**
- Various errors about tables
- "relation does not exist"

**Fix:**
- Run the SQL migration in Supabase
- See Issue 1 fix above

---

### Issue 4: Not Logged In

**Symptoms:**
- "Unauthorized" error
- Can't access AI features

**Fix:**
1. Make sure you're signed in
2. Create an account if you haven't
3. Check browser console for auth errors

---

## 🧪 How to Test

### Test 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try generating an AI plan
4. Look for error messages
5. Share the error with me!

### Test 2: Check Server Terminal

1. Look at terminal where `npm run dev` is running
2. Try generating an AI plan
3. Look for error messages in terminal
4. Share the error with me!

### Test 3: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try generating an AI plan
4. Look for failed requests (red)
5. Click on the failed request
6. Check the error message

---

## 📋 Quick Checklist

Before testing AI, make sure:

- [ ] SQL migration run in Supabase ✅
- [ ] OpenAI key in `.env.local` ✅
- [ ] Server restarted after adding keys ✅
- [ ] Signed in to the app ✅
- [ ] User profile exists in database

---

## 🔍 Debug Steps

1. **Check what error you're seeing:**
   - Browser console (F12 → Console)
   - Server terminal
   - Network tab

2. **Verify setup:**
   ```bash
   # Check OpenAI key exists
   cat .env.local | grep OPENAI
   
   # Check server is running
   curl http://localhost:3000
   ```

3. **Try again:**
   - Refresh browser
   - Try generating a plan
   - Check for new errors

---

## 💬 Tell Me:

**What specific error are you seeing?**
- Error message in browser?
- Error in terminal?
- Nothing happens when clicking button?
- Something else?

**Share the error and I'll help fix it!** 🚀

