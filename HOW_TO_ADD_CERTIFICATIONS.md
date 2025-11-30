# 📚 How to Add Certifications

## Option 1: Add Via SQL (Quick) ✅

### Step 1: Go to Supabase
1. Open your Supabase dashboard
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New query"**

### Step 2: Add Certification
Copy and paste this SQL (replace with your certification details):

```sql
INSERT INTO certifications (slug, name, description, difficulty) VALUES
('your-cert-slug', 'Your Certification Name', 'Description of the certification', 3);
```

**Example:**
```sql
INSERT INTO certifications (slug, name, description, difficulty) VALUES
('aws-solutions-architect', 'AWS Certified Solutions Architect', 'AWS cloud architecture and design', 4),
('cisco-ccna', 'Cisco CCNA', 'Cisco Certified Network Associate', 4);
```

**Difficulty levels:**
- `1` = Very Easy
- `2` = Easy  
- `3` = Medium
- `4` = Hard
- `5` = Very Hard

### Step 3: Run the Query
Click **"Run"** button

### Step 4: Refresh Your App
Refresh the Certifications page - your new certification will appear!

---

## Option 2: Add Common Certifications (Bulk)

You can add multiple popular certifications at once:

```sql
INSERT INTO certifications (slug, name, description, difficulty) VALUES
('comptia-a-plus', 'CompTIA A+', 'Entry-level IT certification covering hardware and software', 3),
('comptia-network-plus', 'CompTIA Network+', 'Networking fundamentals and technologies', 4),
('comptia-security-plus', 'CompTIA Security+', 'Cybersecurity fundamentals', 4),
('aws-certified-cloud-practitioner', 'AWS Certified Cloud Practitioner', 'AWS cloud fundamentals', 3),
('aws-certified-solutions-architect', 'AWS Certified Solutions Architect', 'AWS cloud architecture', 4),
('microsoft-azure-fundamentals', 'Microsoft Azure Fundamentals', 'Azure cloud basics', 3),
('cisco-ccna', 'Cisco CCNA', 'Cisco Certified Network Associate', 4),
('google-cloud-associate', 'Google Cloud Associate Cloud Engineer', 'GCP fundamentals', 3);
```

Just copy, paste, and run in Supabase SQL Editor!

---

## Option 3: Create Your Own (UI Coming Soon)

Currently, you need to use SQL. A UI for adding certifications is coming soon!

---

## After Adding

Once you add a certification:
1. **Refresh the Certifications page** in your app
2. **Click "Start Certification"** to begin tracking
3. **Set your progress** and target date
4. **Generate AI study plans** for it!

---

## Quick Guide

1. ✅ Go to Supabase → SQL Editor
2. ✅ Copy SQL above (modify for your cert)
3. ✅ Click "Run"
4. ✅ Refresh app
5. ✅ Done! 🎉

