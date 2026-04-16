# Linger Setup — 4 Steps

## Step 1: Install Dependencies

```bash
/usr/local/bin/npm install
```

## Step 2: Create `.env.local`

Create this file in the root directory with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key
ANTHROPIC_API_KEY=your_key
```

Get them from:
- Supabase: Project Settings → API Keys
- Anthropic: https://console.anthropic.com/keys

## Step 3: Run Schema

1. Supabase Dashboard → SQL Editor → New Query
2. Paste code from `lib/schema.sql`
3. Click Execute

## Step 4: Start Server

```bash
/usr/local/bin/npm run dev
```

Open http://localhost:3000

---

**That's it!** You now have:
- ✅ Magic link authentication (email login)
- ✅ Creator & Visitor roles
- ✅ Dashboard scaffolds
- ✅ Discover page (mockup)

Next: Test it, then I'll build creator onboarding.
