# 🔗 Supabase Callback URL Configuration Guide

Setting up Supabase authentication callbacks correctly is **critical** for your app to work in production. This guide walks you through the complete setup.

---

## 🎯 Why This Matters

Supabase needs to know which URLs are allowed for authentication redirects. Without proper configuration:

- ❌ Users can't sign up or log in
- ❌ Email confirmations won't work
- ❌ OAuth providers won't redirect correctly
- ❌ Password resets will fail

---

## 📋 What You Need to Configure

In your Supabase Dashboard, you need to set:

1. **Site URL** - Your main app URL
2. **Redirect URLs** - All allowed callback URLs
3. **Additional Redirect URLs** - Wildcard patterns if needed

---

## 🚀 Step-by-Step Setup

### Step 1: Get Your Production URL

After deploying to Vercel, you'll get a URL like:
```
https://life-planner-abc123.vercel.app
```
or with a custom domain:
```
https://yourdomain.com
```

### Step 2: Access Supabase URL Configuration

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **URL Configuration** under Authentication settings

### Step 3: Configure Site URL

In the **Site URL** field, enter your production URL:

```
https://your-app-name.vercel.app
```

**Note:** This is the main URL Supabase will use for redirects when no specific redirect is provided.

### Step 4: Configure Redirect URLs

Add these URLs in the **Redirect URLs** section (add one per line):

```
https://your-app-name.vercel.app/dashboard
https://your-app-name.vercel.app/login
http://localhost:3000/dashboard
http://localhost:3000/login
```

**Why include localhost?**
- Allows local development to continue working
- Supabase supports multiple redirect URLs
- You can test locally while production is live

### Step 5: Configure Additional Redirect URLs (Optional but Recommended)

For more flexibility with email confirmations and magic links, add wildcard patterns:

```
https://your-app-name.vercel.app/**
http://localhost:3000/**
```

The `/**` wildcard allows redirects to any sub-path, which is useful for:
- Email confirmation links
- Password reset flows
- OAuth callbacks with dynamic paths

### Step 6: Save Changes

Click **Save** at the bottom of the page to apply all changes.

---

## 🔍 Current App Configuration

Your app already uses dynamic redirects:

```typescript
// app/(auth)/login/page.tsx
emailRedirectTo: `${window.location.origin}/dashboard`
```

This means:
- ✅ Works automatically with any domain
- ✅ No code changes needed when deploying
- ✅ Only need to configure Supabase dashboard

---

## 📝 Complete Configuration Example

Here's what your Supabase URL Configuration should look like:

### Site URL:
```
https://life-planner.vercel.app
```

### Redirect URLs:
```
https://life-planner.vercel.app/dashboard
https://life-planner.vercel.app/login
http://localhost:3000/dashboard
http://localhost:3000/login
```

### Additional Redirect URLs (if using wildcards):
```
https://life-planner.vercel.app/**
http://localhost:3000/**
```

---

## 🧪 Testing the Configuration

### Test 1: Sign Up Flow
1. Go to your production app
2. Click "Sign Up"
3. Enter email and password
4. Check email for confirmation link
5. Click confirmation link
6. Should redirect to `/dashboard` ✅

### Test 2: Login Flow
1. Go to your production app
2. Click "Sign In"
3. Enter credentials
4. Should redirect to `/dashboard` ✅

### Test 3: Local Development
1. Run `npm run dev` locally
2. Try signing up
3. Should still work with localhost URLs ✅

---

## ⚠️ Common Issues

### Issue: "Invalid redirect URL"

**Symptoms:**
- Users see error after clicking email confirmation
- Redirect fails with error message

**Solution:**
1. Check exact URL in error message
2. Add that exact URL to Redirect URLs in Supabase
3. Or add wildcard pattern `https://your-domain.com/**`

### Issue: "Redirect to http://localhost not allowed"

**Symptoms:**
- Local development auth doesn't work
- Error mentions localhost

**Solution:**
- Make sure `http://localhost:3000/dashboard` and `http://localhost:3000/login` are in Redirect URLs
- Supabase allows multiple redirect URLs

### Issue: "Callback URL mismatch"

**Symptoms:**
- OAuth providers don't work
- Social login fails

**Solution:**
1. Check OAuth provider settings (Google, GitHub, etc.)
2. Ensure callback URLs match exactly
3. Add provider-specific callback URLs to Supabase Redirect URLs

---

## 🔒 Security Best Practices

1. **Never use wildcards in production if not needed**
   - Use specific URLs when possible
   - Wildcards are convenient but less secure

2. **Separate development and production**
   - Use different Supabase projects for dev/prod
   - Or carefully manage redirect URL lists

3. **Use HTTPS only in production**
   - Localhost can use HTTP
   - Production must use HTTPS

4. **Regularly review redirect URLs**
   - Remove unused URLs
   - Remove test/debug URLs from production

---

## 📱 Multiple Environments Setup

If you have multiple environments:

### Development (Local)
```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000/dashboard
  - http://localhost:3000/login
```

### Preview (Vercel Preview Deployments)
```
Redirect URLs:
  - https://your-app-git-branch-username.vercel.app/dashboard
  - https://your-app-git-branch-username.vercel.app/login
```

**Note:** Preview deployments get unique URLs, so you might want to use wildcards or add them manually.

### Production (Vercel Production)
```
Site URL: https://your-app-name.vercel.app
Redirect URLs:
  - https://your-app-name.vercel.app/dashboard
  - https://your-app-name.vercel.app/login
```

---

## 🔄 Updating After Deployment

If you change your domain or deploy URL:

1. **Update Supabase:**
   - Go to Authentication → URL Configuration
   - Update Site URL and Redirect URLs
   - Save changes

2. **Update Vercel Environment Variable:**
   - Update `NEXT_PUBLIC_APP_URL` in Vercel dashboard
   - Redeploy (or wait for next push)

3. **Test:**
   - Try signing up
   - Try logging in
   - Check email confirmation links

---

## ✅ Checklist

Before going live, verify:

- [ ] Site URL set to production domain
- [ ] Production redirect URLs added
- [ ] Localhost URLs added (for development)
- [ ] Wildcard patterns added (if using email confirmations)
- [ ] Configuration saved in Supabase
- [ ] Tested sign up flow
- [ ] Tested login flow
- [ ] Tested email confirmation
- [ ] Tested local development still works

---

## 🆘 Need Help?

If authentication isn't working:

1. **Check Supabase logs:**
   - Go to Authentication → Logs
   - Look for error messages

2. **Check browser console:**
   - Open DevTools (F12)
   - Check for redirect errors

3. **Check Vercel logs:**
   - Go to Vercel dashboard → Project → Logs
   - Check for API errors

4. **Verify environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` is correct
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
   - `NEXT_PUBLIC_APP_URL` matches your Vercel URL

---

**That's it! Your Supabase callbacks are now configured correctly! 🎉**

