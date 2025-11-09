# Trade Page - Go Backend Authentication Update

## Overview
Updated the Trade page (`/next/app/[locale]/trade/page.tsx`) to use Go backend authentication instead of Better Auth session-based authentication.

## Changes Made

### 1. Authentication Import
**Before:**
```typescript
import { useSession } from "@/lib/auth-client"
```

**After:**
```typescript
import { useGoAuth } from "@/contexts/go-auth-context"
```

### 2. Authentication Hook Usage
**Before:**
```typescript
const { data: session, isPending } = useSession()
```

**After:**
```typescript
const { user, token, isLoading: isAuthLoading } = useGoAuth()
```

### 3. Authentication Checks
**Before:**
- Checked for `session` object
- Used `isPending` for loading state

**After:**
- Checks for `user` AND `token` from Go backend
- Uses `isAuthLoading` for loading state

### 4. Redirect Path Updates
**Before:**
- Redirected to `/${locale}/auth/login` (passwordless login)

**After:**
- Redirects to `/${locale}/auth/go/login` (password-based Go authentication)

All authentication redirects now point to the correct Go backend login page.

## Updated Authentication Points

1. **Initial Load Check** (lines 104-108)
   - Redirects to Go login if no user/token

2. **401 Unauthorized Response** (lines 126-130)
   - Redirects to Go login on authentication failure

3. **Error Handling** (lines 204-207)
   - Redirects to Go login on auth-related errors

4. **Agent Creation** (line 257)
   - Validates user/token before creating traders

5. **Component Render Guards** (lines 383-395)
   - Shows loading state while auth is loading
   - Prevents rendering if no user/token

## Authentication Flow

1. **Page Load**: `useGoAuth` checks for existing authentication
2. **No Auth**: Redirects to `/[locale]/auth/go/login` with redirect parameter
3. **Authenticated**: Fetches traders and positions from Go backend
4. **Token Expired**: Redirects to login on 401 responses
5. **All API Calls**: Use `credentials: 'include'` to send session cookies

## Benefits

✅ Unified authentication system (Go backend)
✅ Consistent auth redirects across the application
✅ Proper token validation before API calls
✅ Better error handling for auth failures
✅ No mixed authentication systems

## Related Files

- **Auth Context**: `/next/contexts/go-auth-context.tsx`
- **Login Page**: `/next/app/[locale]/auth/go/login/page.tsx`
- **API Routes**: `/next/app/api/go/auth/*`

## Testing Checklist

- [ ] Unauthenticated users redirect to Go login page
- [ ] Login redirect parameter works correctly
- [ ] Authenticated users can access trade page
- [ ] 401 responses trigger re-authentication
- [ ] Agent creation validates authentication
- [ ] All API calls include session cookies
- [ ] Loading states display correctly

