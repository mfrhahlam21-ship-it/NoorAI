# ⚡ NoorAI Phase 2 - Quick Start

## 🚀 Get Running in 2 Steps

### Step 1: Set Environment Variables
Create or update `.env.local` with Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_TRIAL_DAYS=3
```

**Where to get these:**
1. Go to https://supabase.com
2. Create project or use existing one
3. Settings → API keys → Copy `anon` public key
4. Copy project URL from Settings

### Step 2: Test the Auth System

```bash
# Build the project
npm run build

# Run development server
npm run dev

# Visit http://localhost:3000
```

---

## ✨ What You'll See

1. **First visit:** Login/Register page
2. **Click "إنشاء حساب":** Register new account
3. **Fill form:** Name, email, password
4. **Submit:** Account created with 3-day trial
5. **Auto-redirect:** Login with new credentials
6. **Dashboard:** See launcher features with account button

---

## 🧪 Test Checklist

- [ ] Register new account
- [ ] Check Supabase: User created in `users` table
- [ ] Check Supabase: Subscription created (3-day trial)
- [ ] Login with account
- [ ] See account button in header
- [ ] Click account button → Opens profile modal
- [ ] See subscription status (3 days remaining)
- [ ] Logout → Returns to login page
- [ ] Try to login again → Works

---

## 📁 Key Files

| File | What to Do |
|------|-----------|
| `src/App.tsx` | Entry point - wraps auth |
| `src/AppMain.tsx` | Main launcher - integrate here ↓ |
| `src/pages/AuthPage.tsx` | Already working - no changes |
| `INTEGRATION_GUIDE.md` | Follow this to add components |

---

## 🔧 Integration (5 minutes)

### Add Account Button to AppMain

Find your header in `AppMain.tsx` and add:

```typescript
import { useState } from 'react';
import AccountPage from './components/AccountPage';

// In your component
const [showAccount, setShowAccount] = useState(false);

// In your header/navbar
<button onClick={() => setShowAccount(true)}>👤 حسابي</button>

// At the end of return
{showAccount && <AccountPage onClose={() => setShowAccount(false)} />}
```

### Protect Download Button

Wrap your download button:

```typescript
import { SubscriptionGuard } from './lib/AuthGuard';
import DownloadLocked from './components/DownloadLocked';

<SubscriptionGuard fallback={<DownloadLocked />}>
  <button onClick={downloadLauncher}>📥 تحميل</button>
</SubscriptionGuard>
```

---

## ⚠️ Common Issues

### "Cannot find module" error
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

### Supabase connection error
- Check `.env.local` has correct URL and key
- Check internet connection
- Check Supabase project is active

### Download button locked for active user
- Check user's subscription in Supabase `subscriptions` table
- Verify `end_date` is after today
- Call `refreshSubscription()` to update cache

---

## 📞 Documentation

| File | Read For |
|------|----------|
| `INTEGRATION_GUIDE.md` | Step-by-step instructions |
| `PHASE2_COMPLETE.md` | Complete reference |
| `FILES_OVERVIEW.md` | File descriptions |
| `PHASE2_AUTH_UI.md` | UI specifications |

---

## ✅ Success Checklist

- [ ] App runs with `npm run dev`
- [ ] Login/register page appears
- [ ] Can create new account
- [ ] Trial subscription created in Supabase
- [ ] Can login with credentials
- [ ] Account page shows user info
- [ ] Download button protected
- [ ] Build succeeds with `npm run build`

---

## 🎯 Next Steps

1. ✅ Test locally (you are here)
2. → Integrate components into AppMain (use INTEGRATION_GUIDE.md)
3. → Test integration locally
4. → Deploy to production
5. → Move to Phase 3 (Payment integration)

---

## 💡 Tips

- **Clear cache:** Ctrl+Shift+R in browser (hard refresh)
- **Check console:** F12 → Console tab for errors
- **Test logout:** Click account → Logout button
- **Test trial expiry:** Manually set `end_date` in Supabase to past date, then refresh page
- **Force reload auth:** Clear localStorage: `localStorage.clear()` in console

---

## 🚀 Ready?

```bash
npm run dev
# Visit http://localhost:3000
# Register new account
# Login and explore!
```

**Need help? Read `INTEGRATION_GUIDE.md`**

---

**Phase 2 Status: ✅ Complete & Ready**
**Next: Phase 3 - Payment Integration**
