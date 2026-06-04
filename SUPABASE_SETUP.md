# NoorAI SaaS - Supabase Configuration

## Setup Instructions

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Create a new project
4. Copy these values to `.env.local`:
   - `VITE_SUPABASE_URL` - Project URL
   - `VITE_SUPABASE_ANON_KEY` - Public/Anon Key

### 2. Environment Variables

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_KEY=your_service_key_here (optional, for server-side)
```

### 3. Run Migrations

In Supabase dashboard:
1. Go to SQL Editor
2. Run the SQL from `supabase/migrations/001_initial_schema.sql`
3. Verify tables are created

### 4. Database Tables

✅ `users` - User profiles
✅ `subscriptions` - Subscription plans
✅ `devices` - Device tracking
✅ `payments` - Payment history

All with proper security policies (RLS)
