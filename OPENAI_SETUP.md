# 🤖 OpenAI API Setup

## Is the OpenAI API Key Configured?

**No, the OpenAI API key needs to be added to your environment variables.**

The code is already set up to use OpenAI, but you need to:

1. **Get an OpenAI API Key:**
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (you won't be able to see it again!)

2. **Add it to your environment:**
   - Create a `.env.local` file in the root of your project
   - Add your OpenAI API key:

   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Full `.env.local` template:**
   See `.env.example` for all required environment variables.

## Where OpenAI is Used

The OpenAI API is used for:

- ✅ **Daily AI Coach** - Generates optimized daily plans
- ✅ **Weekly Planning** - Creates 7-day schedules
- ✅ **Certification Study Plans** - Personalized study schedules
- ✅ **Notes Summarization** - AI-powered note summaries
- ✅ **Weekly Reviews** - Analyzes your week
- ✅ **Pattern Analysis** - Identifies productivity patterns
- ✅ **Rewrite My Day** - Generates fresh schedules

All AI features require the `OPENAI_API_KEY` environment variable to be set.

## Testing

After adding your API key:

1. Restart your development server (`npm run dev`)
2. Try generating a daily plan in the AI Coach
3. If you see errors, check that the API key is correct

## Cost Considerations

OpenAI API usage is pay-as-you-go:
- GPT-4 Turbo: ~$0.01-0.03 per request
- GPT-3.5 Turbo: ~$0.001-0.002 per request

The app uses GPT-4 Turbo for best quality. You can modify the model in:
- `lib/ai/coach.ts`
- `lib/ai/certification-planner.ts`
- `lib/ai/notes-summarizer.ts`
- `lib/ai/pattern-analysis.ts`

Look for `model: 'gpt-4-turbo-preview'` and change to `'gpt-3.5-turbo'` if you want lower costs.

---

**Quick Start:**
1. Get API key from OpenAI
2. Create `.env.local` file
3. Add `OPENAI_API_KEY=sk-...`
4. Restart dev server
5. Done! 🚀

