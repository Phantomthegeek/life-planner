# 🔍 Debug AI Not Working

## Quick Checks

### 1. What error are you seeing?

**Option A: "User profile not found"**
- **Problem:** SQL migration not run
- **Fix:** Run the SQL migration in Supabase

**Option B: "OpenAI API key not found"**
- **Problem:** Key not loaded
- **Fix:** Restart server after adding key

**Option C: Nothing happens / Loading forever**
- **Problem:** API call failing
- **Fix:** Check browser console for errors

**Option D: Something else**
- **Need more info:** What's the exact error?

---

## Most Common Issue: User Profile Missing

The AI route needs your user profile from the database. If you haven't run the SQL migration, this will fail.

### Check if you've run SQL migration:

1. Go to Supabase dashboard
2. Click **"Table Editor"** (left sidebar)
3. Check if you see these tables:
   - ✅ `users`
   - ✅ `tasks`
   - ✅ `habits`
   - ✅ `certifications`
   - ✅ `notes`

**If you DON'T see these tables:**
- You need to run the SQL migration
- See `NEXT_STEPS_SUPABASE.md` for instructions

---

## Test the AI API Directly

1. **Make sure you're logged in** (at http://localhost:3000)

2. **Open browser console** (F12 → Console tab)

3. **Run this test:**
```javascript
fetch('/api/ai/coach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: new Date().toISOString().split('T')[0],
    mode: 'normal'
  })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))
```

4. **Check what error you get** - this will tell us what's wrong!

---

## Step-by-Step Fix

### Step 1: Verify Setup
- [ ] SQL migration run? (Check Supabase Table Editor)
- [ ] Signed in to the app?
- [ ] OpenAI key in .env.local?
- [ ] Server restarted after adding keys?

### Step 2: Check Errors
- [ ] Browser console (F12) - any errors?
- [ ] Server terminal - any errors?
- [ ] Network tab - any failed requests?

### Step 3: Test
- [ ] Try the test script above
- [ ] What error do you see?
- [ ] Share the error message

---

**What specific error are you seeing? Share it and I'll help fix it!** 🚀

