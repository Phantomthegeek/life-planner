# Arcana — Improvements & Monetization Roadmap

This is a living document. It captures every concrete improvement that would
make Arcana better, more retentive, and more profitable. Items are grouped by
theme and tagged with rough priority (P0 = next, P1 = soon, P2 = nice to
have).

> **Today's positioning:** "AI productivity & life planner"
> **Recommended wedge:** "The AI study planner for people getting certified"
> A focused wedge is easier to market, easier to rank for, and gives every
> feature decision a sharp criterion: "does this help someone pass a cert?"

---

## 1. Product gaps that move the needle

### Calendar & schedule
- **[P0] Two-way Google Calendar sync.** Motion's killer feature. Tasks
  become real calendar events; events from your calendar block out time the
  coach can't schedule over.
- **[P0] Auto re-plan when a task slips.** If a task runs long or is skipped,
  background job reshuffles the rest of the day. Use existing
  `task_completion_history` + the coach pipeline.
- **[P1] Outlook / iCal / CalDAV sync.** After Google, this is the next 30%
  of the market.
- **[P1] Pre-generate tomorrow's plan tonight.** Cron job at the user's
  sleep_time -1h. Morning open is instant; no token spend on click.
- **[P2] Time-zone aware scheduling.** Pull from `users.timezone`, not the
  request origin.

### "What now?" surface
- **[P0] Dashboard "do this next" card.** ONE next action, always above the
  fold. Snooze / done / reschedule with one tap. This is the single highest
  retention lever.
- **[P1] Mobile bottom-nav** for the 5 most-used routes. Hamburger is a
  retention killer on mobile.
- **[P2] Apple Watch / wearable widget.** Just shows the next block. Drives
  daily opens.

### Chat & memory (already wired)
- **[P0] Streaming responses.** Switch `openai.chat.completions.create` to
  `stream: true` and pipe SSE to the client. Current behaviour waits for the
  full payload — feels much slower than ChatGPT/Claude.
- **[P1] Memory settings page.** Let users view & edit the facts Arcana
  remembers about them. The infra (`chat_memory`) already exists.
- **[P1] "Save to project" alongside save-to-notes.** Conversations attach
  to a project the same way Notion docs attach to a workspace.
- **[P2] Voice mode** (Web Speech API → message; ElevenLabs/OpenAI TTS for
  responses).

### Learning system (your real wedge)
- **[P0] Adaptive lessons.** If a user fails a quiz question, the next
  lesson reinforces that concept. The data already exists in
  `cert_progress_detailed`.
- **[P0] Generate the whole course in one click.** Adding a cert should
  produce all modules and all lessons in the background. *(Shipped.)*
- **[P0] Academic-rigor lessons.** Lessons should match what a real
  classroom teaches — formal definitions, worked examples, mapped to the
  certification's official exam objectives. *(Shipped.)*
- **[P0] 10-question quizzes.** Five is too few to actually test mastery.
  *(Shipped.)*
- **[P1] Spaced repetition.** Track concept-level mastery; surface
  flashcards on a SuperMemo / FSRS schedule.
- **[P1] Past-paper / mock-exam mode.** Timed 60-question exam that mimics
  the real one. Highest perceived value for cert candidates.
- **[P1] Cite official syllabi.** Each module references the official
  objective number (e.g. "AWS SAA-C03 1.2"). Builds trust.
- **[P2] Audio lessons.** Generate TTS for each section; listen in the car.

### Productivity surface
- **[P1] Forward-to-task email address.** Each user gets a unique
  `xyz@inbox.arcana.app`; forwarded emails become tasks.
- **[P1] Slack / Linear / GitHub import.** "@arcana plan this issue."
- **[P2] Browser extension.** Right-click → "save to Arcana."

### Onboarding
- **[P0] 60-second guided tour.** Walks the user through building their
  first plan. Right now a new user lands on an empty dashboard and bounces.
- **[P0] Sample data toggle.** "Try with example tasks" so the dashboard
  is never empty on first load.
- **[P1] Goal-driven setup.** "What are you working toward?" → preselects
  cert, sets target date, drafts a study plan.

### Mobile / PWA
- **[P1] Push notifications** for the day's first block / streak risk
  ("you haven't checked in today — your 14-day streak is at risk").
- **[P1] iOS Lock Screen widget** via App Clip or, eventually, native app.
- **[P2] Offline-first task capture.** Service worker queues writes; sync
  on reconnect.

---

## 2. Engineering & operations

### Reliability
- **[P0] Sentry (or equivalent).** Zero error observability today. You
  can't fix what you can't see.
- **[P0] PostHog (or Plausible + custom events).** Funnel analytics, drop-off
  detection, feature usage.
- **[P0] Rate-limit AI endpoints per user.** Anyone with an account can
  drain your OpenAI bill. Token-bucket per `user_id` keyed in Redis or a
  Supabase table.
- **[P1] Per-user OpenAI cost ledger.** Persist `usage` from each completion
  in a `ai_usage` table; use for billing tiers and abuse detection.

### Performance & cost
- **[P0] Switch most AI calls to `gpt-4o-mini`.** Cheaper than gpt-3.5-turbo
  for similar quality on structured JSON. *(Lesson generator: done.)*
- **[P0] Cache daily plans.** Currently a refresh re-spends tokens. Persist
  in `ai_queries`; invalidate when source tasks change.
- **[P0] Stream chat responses.** Smaller perceived latency.
- **[P1] Parallelize all AI fan-outs.** Did this for weekly plan and lesson
  build — sweep the rest.
- **[P1] Use Edge runtime for stateless reads.** Cuts cold-start latency on
  list/GET endpoints.

### Code health
- **[P1] Replace `console.error` with structured logger.** Pino + a Sentry
  transport.
- **[P1] Integration tests for each API route.** Even just one happy-path
  test per file with `vitest` + Supabase test container.
- **[P1] Move RLS-bypass admin reads into a shared helper.** Pattern is
  already repeated in `lessons` and `build` routes.

### Database
- **[P1] Add `chat_memory.access_count` and bump on each read.** Lets the
  prompt builder prefer high-signal memories.
- **[P1] Soft-delete tasks** with `deleted_at` column. Right now hard
  deletes destroy completion analytics.
- **[P1] Materialized view for daily completion stats** so the statistics
  page doesn't recompute on every request.

---

## 3. Monetization

### Pricing model

| Tier | Price (mo) | What's gated |
|------|-----------|--------------|
| **Free** | $0 | 1 active cert, 1 AI plan/day, 10 chat msgs/day, no lesson gen |
| **Pro** | $9 | Unlimited certs, unlimited plans, unlimited chat, lesson + quiz gen, calendar sync |
| **Lifetime** | $129 one-off | Same as Pro forever. Sell first 500. |
| **Team / classroom** | $5/seat | Shared progress dashboard, instructor view. Targets bootcamps and HR L&D teams. |

> Why this works: AI cost scales with usage. Free is loss-leader to acquire
> users; Pro covers cost + margin around 5–10x the OpenAI spend. Lifetime
> generates cash & social proof early. Team unlocks B2B which has 10x ACV.

### Acquisition channels

- **[P0] SEO landing pages for each major cert.** `/study/aws-saa-c03`,
  `/study/comptia-security-plus`, etc. AI-generate each page from the cert
  data you already have. There's enormous SEO opportunity here — cert-prep
  queries are high-intent commercial keywords.
- **[P0] Reddit & Discord presence** in r/AWSCertifications,
  r/CompTIA, r/CFA. Don't spam — answer questions, link when relevant.
- **[P1] YouTube short-form**: "Pass AWS SAA in 30 days — here's the
  plan Arcana built for me." Same template per cert.
- **[P1] Influencer / cert-prep YouTuber affiliate program.** 30% rev share
  for 12 months.
- **[P2] App Store presence** via PWA-to-native wrappers (Capacitor).

### Conversion & retention

- **[P0] Soft paywall on lesson generation.** Free users see the first
  module's lessons; locking the rest behind Pro converts the most motivated
  users at peak intent.
- **[P0] Day-3, day-7, day-14 lifecycle emails.** "You've completed 2
  lessons. Here's what to do today." Resend or Loops are cheap.
- **[P1] Streak insurance** as a Pro perk — one free skip per week.
- **[P1] Referral**: refer a friend, both get 1 month Pro.
- **[P1] Group study rooms.** Multiplayer accountability = retention.

### B2B / enterprise angles

- **[P1] Sell to bootcamps.** They pay $5k–$50k/yr for cohort tooling that's
  worse than what you have. Pitch: "Replace your ad-hoc Notion + Slack with
  a structured platform."
- **[P1] Sell to HR / L&D teams.** Subsidize employee cert prep. Average
  enterprise L&D budget: $1,200/employee/year.
- **[P2] White-label** for training companies (e.g. A Cloud Guru
  competitors).

### Side revenue

- **[P2] Sponsored cert pages.** If you rank for "AWS SAA prep," AWS
  itself or training vendors will pay placement.
- **[P2] Affiliate links** to official exam vouchers (~$30 per
  conversion).
- **[P2] Premium curated courses** — sell hand-tuned cert tracks at
  $19–49 one-off.

---

## 4. Brand & UX polish

- **[P0] Landing page that names the audience.** "Pass your next
  certification 2x faster" > "AI productivity assistant."
- **[P0] Empty states with example content** everywhere. New users see
  emptiness today; they don't know what's possible.
- **[P0] Skeleton loaders** instead of spinners. Perceived speed.
- **[P1] Keyboard-first commands.** Expand Cmd+K palette with Linear-style
  `G T`, `G P`, `N T` shortcuts. Power users brag about these.
- **[P1] Dark mode contrast audit.** WCAG AA on every page.
- **[P1] Branded share images** (`og:image`) per page. Free distribution
  when users tweet plans / progress.
- **[P2] Public profile pages.** `arcana.app/u/your-name` showing public
  achievements. Drives viral signup.

---

## 5. Risk & ethics

- **[P0] Disclaimer on AI-generated lesson content.** "Generated by AI —
  verify against official exam objectives before relying on it." Reduces
  liability and sets expectations.
- **[P1] Data export & delete.** GDPR-tier hygiene. The export endpoint
  already exists; expose a "delete my account" flow.
- **[P1] Content moderation on chat.** OpenAI's moderation endpoint is
  free; pipe inputs through it to avoid hosting harmful content.
- **[P2] SOC 2 readiness.** Required if you go upmarket.

---

## 6. 30-day next-actions

If I had to pick a single month:

1. **Pick a wedge** (certification candidates) and rewrite the landing page.
2. **Streaming chat** (1 day) — biggest perceived-quality jump.
3. **"Do this next" dashboard card** (2 days) — biggest retention jump.
4. **Sentry + per-user rate limits** (1 day) — keeps the lights on.
5. **Soft paywall + Stripe** (3 days) — start charging.
6. **5 SEO landing pages** for top certs (1 day with AI assist).
7. **Day-3 / day-7 lifecycle emails** (1 day with Resend).
8. **Onboard 10 real users** and watch every session.

Everything else can wait.
