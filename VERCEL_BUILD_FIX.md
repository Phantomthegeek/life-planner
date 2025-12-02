# 🔧 Vercel Build Error Fix

## Issue

Build error on Vercel:
```
Error: Failed to collect page data for /api/ai/certification-study-plan
```

## Root Cause

The API route was being statically analyzed during build time, but it imports OpenAI which tries to initialize at module scope. During build, environment variables might not be available, causing the build to fail.

## Solution Applied

1. **Added dynamic route configuration** to the route file:
   ```typescript
   export const dynamic = 'force-dynamic'
   export const runtime = 'nodejs'
   ```

2. **Made OpenAI client initialization lazy** in `lib/ai/certification-planner.ts`:
   - Changed from module-level initialization to function-level
   - Only creates client when actually needed (runtime)

## Files Modified

- `app/api/ai/certification-study-plan/route.ts`
- `lib/ai/certification-planner.ts`

## If Other Routes Have Similar Issues

Add to the top of any API route file that uses OpenAI:

```typescript
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
```

This tells Next.js:
- Don't try to statically analyze this route
- Always run it as a server-side dynamic route
- Use Node.js runtime (not Edge runtime)

## Testing

After pushing this fix:
1. The build should complete successfully
2. The route will work at runtime
3. Environment variables will be available when the route executes

## Additional Notes

- API routes that use external services (OpenAI, Supabase) should always be marked as `dynamic`
- This prevents Next.js from trying to bundle/analyze them during build
- Environment variables are only available at runtime, not build time

