# Supabase Setup Guide

Follow these steps to set up your Supabase database for Little Einstein:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: Little Einstein
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
4. Wait for the project to be created (2-3 minutes)

## 2. Run the Migration

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration

This will create all necessary tables, indexes, and Row Level Security policies.

## 3. Get Your API Keys

1. Go to Project Settings → API
2. Copy the following values:
   - `URL` (Project URL)
   - `anon` `public` key
   - `service_role` `secret` key (keep this secure!)

## 4. Set Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Configure Authentication

1. Go to Authentication → URL Configuration
2. Add your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback` (if using OAuth)

## 6. Optional: Seed Initial Certifications

You can add some initial certifications by running this in the SQL Editor:

```sql
INSERT INTO certifications (slug, name, description, difficulty) VALUES
('comptia-a-plus', 'CompTIA A+', 'Entry-level IT certification covering hardware and software', 3),
('comptia-network-plus', 'CompTIA Network+', 'Networking fundamentals and technologies', 4),
('comptia-security-plus', 'CompTIA Security+', 'Cybersecurity fundamentals', 4),
('aws-certified-cloud-practitioner', 'AWS Certified Cloud Practitioner', 'AWS cloud fundamentals', 3),
('microsoft-azure-fundamentals', 'Microsoft Azure Fundamentals', 'Azure cloud basics', 3);
```

## 7. Verify Setup

1. Start your development server: `npm run dev`
2. Try signing up at `http://localhost:3000/login`
3. Check your Supabase dashboard → Authentication → Users to see the new user
4. Check your Supabase dashboard → Table Editor to see the user profile created

## Troubleshooting

### Issue: "relation does not exist"
- Make sure you ran the migration SQL script completely
- Check that all tables were created in the Table Editor

### Issue: "new row violates row-level security policy"
- Ensure RLS policies were created (check in Authentication → Policies)
- Verify the trigger function `handle_new_user()` was created

### Issue: User profile not created on signup
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` is working

For more help, check the [Supabase documentation](https://supabase.com/docs).

