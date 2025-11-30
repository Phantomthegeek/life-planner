# Quick Start Guide

Get Little Einstein up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- An OpenAI API key

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL (see `supabase/migrations/001_initial_schema.sql`)
3. Get your API keys from Project Settings → API
4. See `SUPABASE_SETUP.md` for detailed instructions

## Step 3: Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Sign Up

1. Go to the login page
2. Click "Sign Up" to create an account
3. You'll be redirected to the dashboard

## What's Included

✅ **Daily Planner** - Time-blocking calendar view  
✅ **AI Life Coach** - Generate optimized daily plans  
✅ **Certification Tracker** - Track IT cert progress  
✅ **Habits System** - Build daily habits with streaks  
✅ **Notes & Journal** - Daily notes and reflections  
✅ **Dark Mode** - Beautiful dark theme  
✅ **PWA Ready** - Installable web app  

## Next Steps

1. Set your preferences in Settings
2. Create your first habit
3. Try the AI Coach to generate a daily plan
4. Add tasks to your planner
5. Start tracking a certification

## Need Help?

- Check `README.md` for detailed documentation
- See `SUPABASE_SETUP.md` for database setup help
- Review the code comments for implementation details

Happy planning! 🚀

