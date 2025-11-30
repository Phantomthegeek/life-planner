# 📋 How to Run Database Migrations

## ⚠️ **IMPORTANT: Run Migrations in Order!**

You must run the migrations in the correct order to avoid dependency errors.

---

## 📝 **Step-by-Step Instructions**

### **1. Open Supabase SQL Editor**

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

---

### **2. Run Migrations in This Exact Order:**

#### **Migration 1: Initial Schema**
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/001_initial_schema.sql
```

#### **Migration 2: Fix RLS Policies**
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/002_fix_rls_policies.sql
```

#### **Migration 3: Time Tracking & Projects** ⚠️ **IMPORTANT - Fixed!**
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/003_add_time_tracking_projects.sql
```

**This migration has been FIXED** - projects are now created BEFORE time_sessions to avoid dependency errors.

#### **Migration 4: Graph & Events**
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/004_add_graph_and_events.sql
```

#### **Migration 5: Chat System**
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/005_add_chat_system.sql
```

---

## 🔍 **How to Verify Migrations Ran Successfully**

### **Check Tables Exist:**

Run this query to see all your tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like:
- ✅ `users`
- ✅ `tasks`
- ✅ `habits`
- ✅ `certifications`
- ✅ `projects` ← **This should exist after migration 003**
- ✅ `goals`
- ✅ `time_sessions`
- ✅ `chat_conversations`
- ✅ And many more...

---

## ❌ **If You Get Errors**

### **Error: "relation does not exist"**

This means a previous migration hasn't been run. Run them in order!

### **Error: "relation already exists"**

This means the table was already created. You can either:
- Skip that part of the migration (if using `create table if not exists`)
- Or drop and recreate (be careful!)

### **Error: "function does not exist"**

Some migrations depend on functions created in earlier migrations. Make sure you ran:
- Migration 001 (creates `handle_updated_at` function)

---

## 📁 **Migration Files Location**

All migration files are in:
```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_fix_rls_policies.sql
├── 003_add_time_tracking_projects.sql ← **FIXED - projects created first!**
├── 004_add_graph_and_events.sql
└── 005_add_chat_system.sql
```

---

## ✅ **Quick Checklist**

- [ ] Migration 001 - Initial schema (run first)
- [ ] Migration 002 - RLS policies
- [ ] Migration 003 - Projects & time tracking (**FIXED!**)
- [ ] Migration 004 - Graph & events
- [ ] Migration 005 - Chat system

---

## 🎯 **After Running All Migrations**

Your app should work perfectly! All features will be available:
- ✅ Projects
- ✅ Time tracking
- ✅ Chat with Einstein
- ✅ All advanced features

---

## 💡 **Pro Tip**

If you're unsure which migrations you've already run, check your tables:

```sql
-- See all your tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Then compare with what should exist!

---

## 🚀 **You're Ready!**

After running all migrations in order, your Little Einstein app will have full database support for all features!

