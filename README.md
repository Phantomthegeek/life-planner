# Arcana - AI Productivity & Life Planner

An intelligent productivity companion with AI-powered assistance, knowledge management, flow mode, time warp version control, and gamified habit tracking. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Core Features

### 🤖 AI Assistant (Arcana)
- Natural Language Interface: Text and voice communication with AI assistant
- Context-Aware Suggestions: Intelligent recommendations based on current work
- Smart Task Extraction: Automatic task creation from conversations and notes
- Content Generation: AI-powered reports, summaries, and creative content
- Code Assistant: Code analysis, refactoring, and generation with intelligent suggestions

### 🎯 Flow Mode
- Focused Work Sessions: Customizable timer with ambient soundscapes
- Distraction Blocking: Intelligent notification management during focus time
- Flow Analytics: Productivity tracking and pattern recognition
- Adaptive Environment: Automatic adjustments based on productivity patterns

### ⏰ Time Warp (Version Control)
- Comprehensive History: Change tracking across all content
- Visual Timeline: Intuitive document evolution visualization
- Semantic Versioning: Automatic identification of significant changes
- Branching Capability: Alternative version creation for different approaches

### 🔗 Knowledge Management (Arcana Connect)
- Semantic Search: Natural language query support
- Bi-Directional Linking: Connection creation between related notes
- Knowledge Graph: Relationship visualization between ideas and projects
- AI-Powered Tagging: Automatic content categorization and organization
- Content Summarization: Concise summary generation for lengthy documents

### 🏆 Habit Tracker & Gamification
- XP System: Experience points for task completion and habit maintenance
- Streak Tracking: Consistency visualization with streak counters
- Personalized Challenges: Custom challenges based on user goals
- Achievement System: Badges and rewards for productivity milestones
- Progress Visualization: Performance improvement charts over time

### 📅 Additional Features
- **Daily Planner** - Time-blocking schedule with drag-and-drop calendar
- **AI Life Coach** - Generate optimized daily plans based on your preferences
- **Certification Tracker** - Track IT certifications with modules and progress
- **Notes & Journaling** - Daily notes with AI summarization
- **Dark Mode** - Beautiful dark theme support with Arcana theme
- **PWA Ready** - Installable app with offline support
- **Multiple Themes** - 12 beautiful themes including the Arcana theme

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **State Management**: React Hooks
- **Date Handling**: date-fns

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
│   ├── dashboard/        # Dashboard-specific components
│   └── ...
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
- XP and gamification system

### Settings & Customization
- 12 beautiful themes including Arcana theme
- Light/Dark/System mode support
- Notification preferences
- AI model selection and configuration
- Language and timezone settings
- Data export/import functionality

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

See `VERCEL_ENV_SETUP.md` for detailed instructions.

## Design System

Arcana uses a carefully crafted design system with:

- **Color Palette**: Deep Indigo (#2A2D7C), AI Teal (#00C1B3), Arcane Purple (#9C6ADE), Knowledge Gold (#FFBD44), Focus Blue (#4D7CFE)
- **Typography**: Inter for headers, Source Sans Pro for body text
- **Spacing**: 4px base unit system for consistent rhythm
- **Components**: Purposeful, accessible UI components with defensive CSS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
