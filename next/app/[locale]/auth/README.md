# Authentication Directory

This directory contains all authentication-related pages for the Ryu application. It provides both password-based and passwordless authentication options.

## Directory Structure

```
auth/
├── password/
│   ├── login/
│   │   └── page.tsx          # Password login with 2FA
│   ├── register/
│   │   └── page.tsx          # Password registration with 2FA setup
│   └── reset-password/
│       └── page.tsx          # Password reset with 2FA verification
└── passwordless/
    └── login/
        └── page.tsx          # Email OTP passwordless login
```

## Authentication Methods

### 1. Password-Based Authentication

Located in `auth/password/`, this method uses traditional email and password credentials with optional two-factor authentication.

#### Login (`/auth/password/login`)
**Features:**
- Email and password authentication
- Two-step flow:
  1. Email and password input
  2. OTP verification (if 2FA is enabled)
- Show/hide password toggle
- "Forgot password?" link
- Link to registration page

**Implementation:**
- Uses `usePasswordAuth` context from `/contexts/password-auth-context.tsx`
- Calls `/api/login` endpoint
- Calls `/api/verify-otp` for 2FA verification
- Stores auth token and user info in localStorage

#### Register (`/auth/password/register`)
**Features:**
- Three-step registration flow:
  1. **Register**: Email, password, confirm password, optional beta code
  2. **Setup OTP**: Display QR code and secret for authenticator app
  3. **Verify OTP**: Enter code to complete registration

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@#$%!&*?)
- Passwords must match

**Beta Mode:**
- If enabled, requires a 6-character alphanumeric beta code
- Checked via `/api/system-config` endpoint

**Implementation:**
- Uses `usePasswordAuth` context
- Calls `/api/register` to create account and get OTP secret
- Displays QR code for scanning with authenticator app
- Calls `/api/complete-registration` to verify OTP and complete setup

#### Reset Password (`/auth/password/reset-password`)
**Features:**
- Single-step password reset with 2FA verification
- Email input
- New password and confirm password fields
- Real-time password validation
- OTP code verification from authenticator app
- Success message with automatic redirect to login

**Requirements:**
- User must have email registered in the system
- User must have 2FA already configured
- Must provide valid OTP code from authenticator app
- New password must meet all password requirements

**Implementation:**
- Uses `usePasswordAuth` context
- Calls `/api/reset-password` with email, new password, and OTP code
- Validates password strength before submission
- Redirects to login page after successful reset

### 2. Passwordless Authentication

Located in `auth/passwordless/`, this method uses email-only authentication with one-time codes sent via email.

#### Login (`/auth/passwordless/login`)
**Features:**
- Email-only authentication
- Two-step flow:
  1. Enter email address
  2. Verify code sent to email
- Resend code functionality
- Automatic registration for new users

**Implementation:**
- Uses `authClient` from `/lib/auth-client.ts` (better-auth)
- Sends verification code to email
- No password required
- No separate registration needed

## Context Providers

### PasswordAuthProvider

Located at `/contexts/password-auth-context.tsx`, this context provides:

**State:**
- `user: User | null` - Current user object
- `token: string | null` - Authentication token
- `isLoading: boolean` - Loading state

**Methods:**
- `login(email, password)` - Authenticate with credentials
- `verifyOTP(userID, otpCode)` - Verify 2FA code
- `register(email, password, betaCode?)` - Create new account
- `completeRegistration(userID, otpCode)` - Complete registration with OTP
- `resetPassword(email, newPassword, otpCode)` - Reset password with 2FA ✨
- `loginAdmin(password)` - Admin authentication
- `logout()` - Sign out

**Features:**
- Automatic token management in localStorage
- Unauthorized event listener (handles 401 responses)
- Direct API communication

## API Endpoints

The authentication system uses Next.js API routes in `/app/api/go/` that proxy requests to the Go backend server on port 8080.

### API Architecture

```
Frontend (Next.js) → Next.js API Routes (/api/go/*) → Go Backend (port 8080)
```

**Configuration**: Set `GO_API_URL` environment variable (default: `http://localhost:8080`)

For detailed API documentation, see [/app/api/go/README.md](/app/api/go/README.md)

The authentication system uses these API endpoints:

### Password-Based Endpoints

**POST /api/go/login** (proxies to Go backend `/api/login`)
- Request: `{ email, password }`
- Response: `{ requires_otp: boolean, user_id: string, message: string }` or `{ error: string }`

**POST /api/go/register** (proxies to Go backend `/api/register`)
- Request: `{ email, password, beta_code?: string }`
- Response: `{ user_id, otp_secret, qr_code_url, message }` or `{ error }`

**POST /api/go/verify-otp** (proxies to Go backend `/api/verify-otp`)
- Request: `{ user_id, otp_code }`
- Response: `{ token, user_id, email, message }` or `{ error }`

**POST /api/go/complete-registration** (proxies to Go backend `/api/complete-registration`)
- Request: `{ user_id, otp_code }`
- Response: `{ token, user_id, email, message }` or `{ error }`

**POST /api/go/reset-password** ✨ (proxies to Go backend `/api/reset-password`)
- Request: `{ email, new_password, otp_code }`
- Response: `{ message }` or `{ error }`
- Note: User must have 2FA configured to reset password

**POST /api/go/admin-login** (proxies to Go backend `/api/admin-login`)
- Request: `{ password }`
- Response: `{ token, user_id, email }` or `{ error }`

**POST /api/go/logout** (proxies to Go backend `/api/logout`)
- Headers: `Authorization: Bearer {token}`

**GET /api/go/system-config** (proxies to Go backend `/api/system-config`)
- Response: `{ beta_mode: boolean, ... }`

### Passwordless Endpoints

Handled automatically by better-auth:
- Email OTP sending
- Email OTP verification
- Session management

## Styling

Both authentication methods use consistent styling:

**Colors:**
- Background: `#0B0E11` (dark)
- Panel: `#181A20` with border `#2B3139`
- Text primary: `#EAECEF`
- Text secondary: `#848E9C`
- Accent: `#F0B90B` (yellow)
- Error: `#F6465D` (red)

**Components:**
- Dark theme by default
- Responsive design
- Loading states with disabled buttons
- Error message displays
- Form validation

## URL Structure

All authentication pages follow the pattern:
```
/{locale}/auth/{method}/{action}
```

Examples:
- `/en/auth/password/login`
- `/en/auth/password/register`
- `/en/auth/password/reset-password` ✨
- `/en/auth/passwordless/login`
- `/zh/auth/password/login`

## Redirect Handling

After successful authentication, users are redirected to:
1. URL specified in `?redirect=` query parameter
2. Home page (`/{locale}`) if no redirect is specified

Example: `/en/auth/password/login?redirect=/dashboard` → redirects to `/dashboard` after login

## Security Features

### Password-Based
- Strong password requirements enforced
- Two-factor authentication with TOTP
- Password hashing (server-side)
- Secure token storage
- Beta code validation (optional)

### Passwordless
- Time-limited OTP codes
- Email verification
- No password to compromise
- Automatic session management

## Usage Examples

### Password Login
```typescript
import { usePasswordAuth } from "@/contexts/password-auth-context";

const { login, verifyOTP } = usePasswordAuth();

// Step 1: Login with credentials
const result = await login(email, password);
if (result.success && result.requiresOTP) {
  // Step 2: Verify OTP
  const otpResult = await verifyOTP(result.userID, otpCode);
}
```

### Password Registration
```typescript
import { usePasswordAuth } from "@/contexts/password-auth-context";

const { register, completeRegistration } = usePasswordAuth();

// Step 1: Register
const result = await register(email, password, betaCode);
if (result.success) {
  // Step 2: Show QR code (result.qrCodeURL, result.otpSecret)
  // Step 3: Complete registration
  await completeRegistration(result.userID, otpCode);
}
```

### Password Reset ✨
```typescript
import { usePasswordAuth } from "@/contexts/password-auth-context";

const { resetPassword } = usePasswordAuth();

// Reset password with OTP verification
const result = await resetPassword(email, newPassword, otpCode);
if (result.success) {
  // Password reset successful, redirect to login
  router.push(`/${locale}/auth/password/login`);
}
```

### Passwordless Login
```typescript
import { authClient } from "@/lib/auth-client";

// Step 1: Send OTP
await authClient.emailOtp.sendVerificationOtp({
  email,
  type: "sign-in",
});

// Step 2: Verify OTP
await authClient.signIn.emailOtp({
  email,
  otp,
});
```

## Migration from Web Folder

This implementation is based on the web folder's authentication system:
- Same API contracts
- Same authentication flows
- Same security requirements
- Adapted for Next.js App Router
- Server-side rendering compatible
- Integrated with Next.js internationalization

