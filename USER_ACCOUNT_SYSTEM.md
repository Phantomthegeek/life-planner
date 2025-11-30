# 👤 User Account System - How It Works

## 📋 Overview

Little Einstein uses **Supabase Authentication** for user management, with a custom `users` table that extends the auth system with additional user preferences.

---

## 🔐 Authentication Flow

### 1. **Sign Up Process**

```
User → Login Page → Enters Email/Password → Supabase Auth
                                    ↓
                            Email Confirmation Sent
                                    ↓
                            User Clicks Link
                                    ↓
                    User Record Created in auth.users
                                    ↓
                User Profile Auto-Created in public.users
```

**How it works**:
- User visits `/login` page
- Fills in email and password
- Clicks "Sign Up"
- Supabase sends confirmation email
- User clicks link in email
- Account is activated
- Profile is created in `public.users` table

### 2. **Sign In Process**

```
User → Login Page → Enters Credentials → Supabase Auth
                                    ↓
                            Validates Credentials
                                    ↓
                            Creates Session
                                    ↓
                    Redirects to /dashboard
                                    ↓
                Middleware Protects Routes
```

**How it works**:
- User enters email/password
- Supabase validates credentials
- Session cookie is set
- User is redirected to dashboard
- All dashboard routes are protected by middleware

### 3. **Session Management**

- Sessions are managed by Supabase Auth
- Uses HTTP-only cookies for security
- Sessions persist across browser restarts
- Can be manually logged out

---

## 🗄️ Database Schema

### `auth.users` (Supabase Managed)
- `id` - UUID (primary key)
- `email` - User's email address
- `encrypted_password` - Hashed password
- `email_confirmed_at` - Confirmation timestamp
- `created_at` - Account creation date

### `public.users` (Custom Extension)

```sql
CREATE TABLE public.users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  wake_time text DEFAULT '07:00',
  sleep_time text DEFAULT '23:00',
  work_hours_start text DEFAULT '09:00',
  work_hours_end text DEFAULT '17:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Fields**:
- `id` - Links to `auth.users.id`
- `email` - User's email (synced from auth)
- `full_name` - Display name
- `avatar_url` - Profile picture URL
- `wake_time` - Daily wake time (for AI planning)
- `sleep_time` - Daily sleep time
- `work_hours_start` - Work start time
- `work_hours_end` - Work end time

---

## 🔒 Security & Row Level Security (RLS)

All tables use **Row Level Security (RLS)** to ensure users can only access their own data:

```sql
-- Example: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);
```

**What this means**:
- Users can ONLY see their own tasks, habits, notes, etc.
- Database enforces security at the SQL level
- No need to manually filter by user_id in queries
- Prevents data leakage between users

---

## 🛠️ How User Data Works

### Creating a User Profile

When a user signs up:

1. **Supabase Auth** creates the auth user
2. **Database Trigger** (or API) creates profile in `public.users`
3. Profile gets default values:
   - Wake time: 07:00
   - Sleep time: 23:00
   - Work hours: 09:00 - 17:00

### Accessing User Data

**Server-side** (API routes):
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Fetch user profile
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single()
```

**Client-side**:
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### User Context Throughout App

Every protected route:
1. Checks if user is authenticated (via middleware)
2. Fetches user data if needed
3. Uses `user.id` to filter data automatically (via RLS)

---

## 📍 User Account Pages

### Current Pages:

1. **`/login`** - Sign in / Sign up page
   - Handles authentication
   - Redirects to dashboard on success

2. **`/dashboard/settings`** - General settings
   - Theme preferences
   - Daily schedule preferences
   - Notification settings

3. **`/dashboard/settings/profile`** - NEW! User profile page
   - View and edit profile
   - Change name
   - View account info
   - See member since date

---

## 🔄 User Data Flow

```
┌─────────────────┐
│  User Signs Up  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Auth  │ Creates auth.users record
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Profile Table  │ Creates public.users record
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Data      │ All tables link to user.id
│  - Tasks        │ RLS enforces ownership
│  - Habits       │
│  - Notes        │
│  - Certs        │
└─────────────────┘
```

---

## 🔑 Key Features

### 1. **Automatic User Creation**
- When user signs up, profile is auto-created
- No manual setup required

### 2. **Secure by Default**
- RLS policies protect all data
- Users can't access others' data
- All queries filtered by user automatically

### 3. **Session Management**
- Secure HTTP-only cookies
- Automatic session refresh
- Logout clears session

### 4. **Profile Extension**
- Extends Supabase auth with custom fields
- Stores user preferences
- Used by AI for personalized planning

---

## 🎯 Usage Examples

### Get Current User:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Update User Profile:
```typescript
await supabase
  .from('users')
  .update({ full_name: 'John Doe' })
  .eq('id', user.id)
```

### Fetch User's Tasks:
```typescript
// RLS automatically filters by user_id
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  // No need to filter by user_id - RLS does it!
```

---

## 🔮 Future Enhancements

1. **Avatar Upload** - Profile picture upload to Supabase Storage
2. **Email Verification** - Enhanced email confirmation flow
3. **Password Reset** - Forgot password functionality
4. **Two-Factor Auth** - Enhanced security
5. **OAuth Providers** - Sign in with Google/GitHub
6. **Account Deletion** - User can delete their account

---

## 📝 Summary

**User Account System = Supabase Auth + Custom Profile Table**

- ✅ Secure authentication via Supabase
- ✅ Custom user preferences in `public.users`
- ✅ Row Level Security protects all data
- ✅ Automatic user profile creation
- ✅ Session-based authentication
- ✅ Profile management page

**Everything is secure, automatic, and user-friendly!** 🔒✨

