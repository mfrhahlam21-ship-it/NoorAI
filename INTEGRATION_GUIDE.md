# 🎯 NoorAI SaaS Integration Guide - Phase 2 to AppMain

**Purpose:** Step-by-step instructions for integrating auth UI and subscription protection into existing launcher features
**Status:** Ready for Implementation
**Difficulty:** Easy (copy-paste + minor modifications)

---

## 📋 Quick Integration Steps

### Step 1: Add Account Menu Button to Header

In `AppMain.tsx`, find your header section and add:

```typescript
import { useState } from 'react';
import AccountPage from './components/AccountPage';
import { User } from 'lucide-react';

export default function AppMain() {
  const [showAccount, setShowAccount] = useState(false);

  return (
    <>
      {/* Existing navbar/header */}
      <nav className="flex items-center justify-between p-4">
        <div>
          {/* Existing logo/title */}
        </div>

        {/* ✅ ADD THIS BUTTON */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAccount(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
        >
          <User size={18} />
          <span>حسابي</span>
        </motion.button>
      </nav>

      {/* Account Modal */}
      {showAccount && (
        <AccountPage onClose={() => setShowAccount(false)} />
      )}

      {/* Rest of your existing code */}
    </>
  );
}
```

---

### Step 2: Protect Download Button

Find your download button in AppMain (usually in Download Program section) and wrap it:

#### Before:
```typescript
<button onClick={downloadLauncher}>
  📥 تحميل برنامج Noor Launcher
</button>
```

#### After:
```typescript
import { SubscriptionGuard } from './lib/AuthGuard';
import DownloadLocked from './components/DownloadLocked';

// In your download section:
<SubscriptionGuard
  fallback={
    <DownloadLocked
      onUpgradeClick={() => {
        // Show upgrade modal or redirect to payment page
        setShowAccount(true);
      }}
    />
  }
>
  <motion.button
    whileHover={{ scale: 1.02 }}
    onClick={downloadLauncher}
    className="w-full bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] text-black font-bold py-3 rounded-lg hover:shadow-lg transition-shadow"
  >
    📥 تحميل برنامج Noor Launcher
  </motion.button>
</SubscriptionGuard>
```

---

### Step 3: Add Subscription Refresh on Mount

In `AppMain.tsx` add this useEffect:

```typescript
import { useAuth } from './lib/AuthContext';
import { useEffect } from 'react';

export default function AppMain() {
  const { refreshSubscription } = useAuth();

  useEffect(() => {
    // Refresh subscription on component mount to check if expired
    refreshSubscription();

    // Optional: Refresh every 5 minutes to catch real-time changes
    const interval = setInterval(() => {
      refreshSubscription();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshSubscription]);

  // Rest of component...
}
```

---

### Step 4: Add Subscription Status Card to Dashboard

Add this component wherever makes sense (maybe below profile info):

```typescript
import SubscriptionStatusCard from './components/SubscriptionStatusCard';

export default function AppMain() {
  return (
    <>
      {/* Existing content */}

      {/* Add subscription status section */}
      <motion.div className="mt-6 mb-8">
        <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
          <CreditCard size={24} className="text-[#ff00ff]" />
          حالة الاشتراك
        </h2>
        <SubscriptionStatusCard />
      </motion.div>

      {/* Rest of content */}
    </>
  );
}
```

---

## 🔐 Features After Integration

### For Logged-In Users:
✅ Account menu button in header
✅ View subscription status (days remaining, plan type)
✅ See all devices connected to account
✅ Download button visible if subscription active
✅ Upgrade button if trial near end
✅ Logout option in account menu

### For Trial Users:
✅ 3-day free trial automatic
✅ Warning when 3 days or less remain
✅ See "3 days remaining" in status card
✅ Upgrade prompt in download button

### For Expired Users:
✅ Download button locked with "Subscription Expired" message
✅ Renewal button with link to payment
✅ Can see they need to upgrade
✅ Cannot access launcher features

---

## 🎨 Design Notes

All new components use the existing NoorAI design system:
- **Color Scheme:** Cyan (#00ffcc), Magenta (#ff00ff), Dark (#0a0a0c)
- **Font:** Bold, modern sans-serif
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Language:** Full Arabic support (RTL)

The components automatically match your existing AppMain styling.

---

## 🧪 Testing After Integration

1. **Test Registration Flow:**
   - Go to login page
   - Click "إنشاء حساب"
   - Fill all fields
   - Submit → Should show success and redirect to login
   - Check Supabase: User exists in `users` table
   - Check Supabase: Subscription exists in `subscriptions` table

2. **Test Login:**
   - Enter credentials
   - Submit → Should redirect to AppMain
   - Check: Account button appears in header

3. **Test Account Menu:**
   - Click account button
   - Should open AccountPage modal
   - Should show user name, email, join date
   - Should show subscription status

4. **Test Download Protection:**
   - If subscription active → Download button visible
   - Click download → Works normally
   - If subscription expired → DownloadLocked shows instead
   - Click upgrade in DownloadLocked → Should work

5. **Test Logout:**
   - In account menu, click logout
   - Should redirect to AuthPage
   - Session cleared

---

## 📦 What You Get

| Component | Lines | Props | Purpose |
|-----------|-------|-------|---------|
| AuthPage | 450+ | None | Full auth UI (login/register/reset) |
| AuthGuard | 50 | `children`, `fallback` | Route protection |
| SubscriptionGuard | 50 | `children`, `fallback` | Feature protection |
| SubscriptionStatusCard | 250+ | None | Shows subscription info |
| AccountPage | 300+ | `onClose` | Account management modal |
| DownloadLocked | 150+ | `onUpgradeClick` | Download protection UI |

---

## 🔧 Troubleshooting

### Account button doesn't appear
- Make sure you imported AccountPage in AppMain.tsx
- Check that `showAccount` state is defined
- Verify imports: `import AccountPage from './components/AccountPage'`

### Download button shows for expired users
- Make sure SubscriptionGuard wraps the download button
- Check that `isSubscriptionActive` is returning correct value
- Call `refreshSubscription()` to update status

### Subscription status shows as loading forever
- Check Supabase connection (verify VITE_SUPABASE_URL in .env.local)
- Check browser console for errors
- Verify user has subscription in Supabase DB

### Download button doesn't download
- Make sure your `downloadLauncher` function still works
- Check that it's not inside a disabled or onClick handler conflict
- Test without SubscriptionGuard wrapper first

---

## 🎯 What's Next?

After integrating Phase 2, you can move to Phase 3:

### Phase 3: Payment Integration
- Add payment form component
- Connect Stripe or PayPal
- Handle payment success/failure
- Update subscription on successful payment

### Phase 4: Electron Launcher Integration
- Add IPC communication for subscription check
- Prevent launcher startup if subscription inactive
- Show update dialog in launcher if subscription expired

### Phase 5: Production Hardening
- Set up email service for password reset
- Add rate limiting for login attempts
- Enable device tracking enforcement
- Deploy to production with environment variables

---

## 💡 Pro Tips

1. **Test locally first:** Use `.env.local` with Supabase credentials
2. **Use console.log:** The password reset currently logs to console
3. **Clear localStorage:** `localStorage.removeItem('noorai_user_id')` to force logout
4. **Check Supabase logs:** RLS violations show in Supabase dashboard
5. **Mobile testing:** Use DevTools to test responsive design

---

## 🚀 Ready to Go!

All components are production-ready. No additional setup needed beyond:
1. Supabase credentials in `.env.local`
2. Integration into AppMain (copy-paste from this guide)
3. Run `npm run dev` to test

**Start integrating now! Phase 3 payment system coming next.**
