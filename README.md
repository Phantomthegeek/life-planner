# Little Einstein - Life Planner & AI Study Coach

A comprehensive life planning and AI-powered study coaching application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📅 **Daily Planner** - Time-blocking schedule with drag-and-drop calendar
- 🤖 **AI Life Coach** - Generate optimized daily plans based on your preferences
- 📚 **Certification Tracker** - Track IT certifications with modules and progress
- 🎯 **Habits System** - Build and track daily habits with streak tracking
- 📝 **Notes & Journaling** - Daily notes with AI summarization
- 🌙 **Dark Mode** - Beautiful dark theme support
- 📱 **PWA Ready** - Installable app with offline support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **State Management**: Zustand
- **Data Fetching**: React Query

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd life-planner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:
- Create a new Supabase project
- Run the migration file located at `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:
- `users` - User profiles and preferences
- `certifications` - Available certifications
- `cert_modules` - Certification modules
- `user_cert_progress` - User certification progress
- `tasks` - Daily tasks and events
- `habits` - User habits
- `notes` - Daily notes
- `ai_queries` - AI interaction history

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages (protected)
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard-specific components
├── lib/                   # Utility libraries
│   ├── ai/               # AI/OpenAI integration
│   ├── supabase/         # Supabase client & types
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── supabase/              # Database migrations
```

## Features in Detail

### Daily Planner
- Time-blocking calendar view
- Drag-and-drop task scheduling
- Task categories and priorities
- Auto-reschedule missed tasks
- Daily and weekly views

### AI Life Coach
- Generate optimized daily schedules
- Consider user preferences (wake time, work hours, energy levels)
- "Light day" mode for easier schedules
- "Intense day" mode for maximum productivity
- Structured JSON responses for reliability

### Certification Tracker
- Track multiple IT certifications
- Break down certifications into modules
- Track progress percentage
- Set exam dates and countdown
- AI-generated study plans

### Habits System
- Create custom habits
- Track daily completion
- Streak tracking
- Best streak records
- Visual progress indicators

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

