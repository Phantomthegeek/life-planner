# 🚀 Quick Test Guide

## Step-by-Step Testing

### 1. Start Your Server (If Not Running)

```bash
npm run dev
```

Wait until you see:
```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

### 2. Open Browser

Go to: **http://localhost:3000**

### 3. Sign In / Sign Up

- Create an account if you don't have one
- Or sign in if you already have an account

### 4. Test AI Coach (Easiest Test) ✨

1. Click **"AI Coach"** in the navigation bar (or go to `/dashboard/coach`)
2. You'll see 3 buttons: "Normal Day", "Light Day", "Intense Day"
3. Click **"Generate Plan"** on the "Normal Day" card
4. Wait a few seconds (you'll see a loading spinner)
5. **SUCCESS** = A dialog opens with:
   - A daily schedule
   - Tasks with times
   - Action items
   - Motivation message

### 5. If It Works ✅

You'll see something like:
```
"Your AI-Generated Daily Plan"
- Summary: "A productive day balancing work and study..."
- Schedule:
  * 09:00 - 10:00 Morning Routine
  * 10:00 - 12:00 Focus Work
  ...
- Action Items: [...]
- Motivation: "You've got this!"
```

### 6. If It Fails ❌

Check:
- Browser console (Press F12 → Console tab) for errors
- Terminal where `npm run dev` is running for errors
- Make sure `.env.local` file exists with your OpenAI key
- **Restart the dev server** after adding the key

---

## Other Quick Tests

### Test Notes Summarization
1. Go to **Notes** page
2. Write: "Today I studied React hooks and built a todo app"
3. Click **"AI Summarize"** button
4. Should see summary, key points, insights

### Test Weekly Review
1. Go to **AI Coach** → **Weekly Review** (link at top)
2. Click **"Generate Weekly Review"**
3. Should see analysis of your week

---

## Quick Check Commands

### Verify .env.local exists:
```bash
cat .env.local | grep OPENAI
```

### Check if server is running:
```bash
curl http://localhost:3000 2>/dev/null | head -1
```

---

**Ready to test? Start your server and try the AI Coach!** 🎯

