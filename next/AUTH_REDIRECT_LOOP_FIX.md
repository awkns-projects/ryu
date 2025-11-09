# Authentication Redirect Loop Fix

## Problem

After successfully logging in with OTP, users were immediately redirected back to the login page when accessing the trade page, creating an infinite redirect loop.

## Root Cause

The issue was caused by **`router.refresh()`** being called immediately after successful OTP verification in the login page. This forced a full page reload which caused timing issues with the authentication state:

1. User verifies OTP successfully
2. `verifyOTP()` saves token/user to localStorage
3. React state updates (async)
4. `router.push()` navigates to trade page
5. **`router.refresh()` forces full page reload** ← **THE PROBLEM**
6. Trade page loads and checks auth
7. Auth context hasn't initialized yet from localStorage
8. Trade page sees no auth → redirects to login

## The Fix

### **Removed `router.refresh()`**
This method forces a full browser reload which interferes with React's state management and the authentication context initialization.

### **Added Small Delay (100ms)**
Added a brief delay before navigation to ensure localStorage write operation completes and state updates propagate.

### **Added Debug Logging**
Added console logs to track the authentication flow:
- `✅ Login: OTP verified, redirecting...`
- `🔀 Login: Redirecting to [path]`

## Changes Made

### File: `/next/app/[locale]/auth/go/login/page.tsx`

**Before:**
```typescript
const result = await verifyOTP(userID, otpCode);

if (result.success) {
  const redirectTo = searchParams.get("redirect") || `/${locale}`;
  router.push(redirectTo);
  router.refresh(); // ❌ CAUSES ISSUES
}
```

**After:**
```typescript
const result = await verifyOTP(userID, otpCode);

if (result.success) {
  console.log('✅ Login: OTP verified, redirecting...');
  
  // Small delay to ensure localStorage is written
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const redirectTo = searchParams.get("redirect") || `/${locale}`;
  console.log('🔀 Login: Redirecting to', redirectTo);
  router.push(redirectTo);
  // ✅ No router.refresh() - prevents full page reload
}
```

## Authentication Flow (Fixed)

```
1. User enters email/password
   ↓
2. Backend returns requires_otp: true
   ↓
3. User enters OTP code
   ↓
4. verifyOTP() called
   ↓
5. Backend returns token + user info
   ↓
6. Token & user saved to localStorage ✅
   ↓
7. React state updated (user, token) ✅
   ↓
8. 100ms delay (ensure write completes) ✅
   ↓
9. router.push() to trade page ✅
   ↓
10. Trade page loads
    ↓
11. GoAuthProvider reads from localStorage ✅
    ↓
12. user & token found → Access granted ✅
```

## Debug Console Output

With the fix, you should see:
```
💾 GoAuth: Auth saved to localStorage
✅ Login: OTP verified, redirecting...
🔀 Login: Redirecting to /en/trade
🔍 GoAuth: Checking localStorage... { hasToken: true, hasUser: true }
✅ GoAuth: Restored auth from localStorage user@example.com
🔐 Auth state: { hasUser: true, hasToken: true }
✅ User authenticated: user@example.com
🔄 Fetching trading data...
```

## Testing

1. **Clear browser localStorage** (Application tab → Local Storage → Clear All)
2. **Navigate to `/auth/go/login`**
3. **Enter credentials and OTP**
4. **Check console logs** - should see successful auth restoration
5. **Verify trade page loads** without redirecting to login

## Related Files

- `/next/contexts/go-auth-context.tsx` - Auth context with localStorage persistence
- `/next/app/[locale]/trade/page.tsx` - Protected trade page
- `/next/app/[locale]/auth/go/login/page.tsx` - Login page (fixed)

## Key Takeaways

✅ **Never use `router.refresh()` after authentication** - it breaks React state
✅ **Allow time for localStorage writes** - async operations need time
✅ **Use `router.push()` for client-side navigation** - preserves React state
✅ **Add debug logging** - helps diagnose auth issues quickly

