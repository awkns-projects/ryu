# Password Reset Page

This page allows users to reset their password using email verification and two-factor authentication.

## Features

### Single-Step Reset Flow
Users can reset their password in a single form by providing:
1. Email address
2. New password (with confirmation)
3. OTP code from authenticator app

### Password Validation
Real-time password strength validation with visual feedback:
- ✓ Minimum 8 characters
- ✓ At least one uppercase letter
- ✓ At least one lowercase letter  
- ✓ At least one number
- ✓ At least one special character (@#$%!&*?)
- ✓ Passwords must match

### Security Features
- Requires valid OTP code from authenticator app (2FA)
- Must be registered email in the system
- User must have 2FA already configured
- Password strength validation before submission
- Show/hide password toggles

### User Experience
- Clear visual feedback for password requirements
- Error message display
- Loading states
- Success message with automatic redirect
- "Back to Login" and "Remember your password?" links

## URL

```
/{locale}/auth/go/reset-password
```

Examples:
- `/en/auth/go/reset-password`
- `/zh/auth/go/reset-password`

## Implementation

### Context
Uses `useGoAuth` from `/contexts/go-auth-context.tsx`:

```typescript
const { resetPassword } = useGoAuth();
```

### API Endpoint
**POST /api/reset-password**
- Request: `{ email, new_password, otp_code }`
- Response: `{ message }` or `{ error }`

### Flow

1. User enters email, new password, confirm password, and OTP code
2. Form validates password strength requirements
3. On submit, calls `resetPassword(email, newPassword, otpCode)`
4. If successful:
   - Shows success message
   - Auto-redirects to login page after 3 seconds
5. If failed:
   - Displays error message
   - User can try again

### Code Example

```typescript
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess(false);

  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (!passwordValid) {
    setError("Password does not meet requirements");
    return;
  }

  setLoading(true);

  const result = await resetPassword(email, newPassword, otpCode);

  if (result.success) {
    setSuccess(true);
    setTimeout(() => {
      router.push(`/${locale}/auth/go/login`);
    }, 3000);
  } else {
    setError(result.message || "Password reset failed");
  }

  setLoading(false);
};
```

## Styling

Matches the password-based authentication design:
- Dark background: `#0B0E11`
- Panel: `#181A20` with border `#2B3139`
- Text primary: `#EAECEF`
- Text secondary: `#848E9C`
- Accent: `#F0B90B` (yellow)
- Error: `#F6465D` (red)
- Success: Green checkmarks

## Navigation

**From:**
- Login page → "Forgot password?" link
- Register page → Manual navigation

**To:**
- Login page (after successful reset)
- Login page ("Remember your password?" link)
- Login page ("Back to Login" button)
- Home page (header logo/back button)

## Requirements

### Prerequisites
- User must have a registered account
- User must have 2FA (TOTP) configured during registration
- User must have access to their authenticator app

### Input Validation
- Email: Valid email format
- New Password: Must meet all 6 password requirements
- Confirm Password: Must match new password
- OTP Code: Exactly 6 digits

### Submit Button
Disabled when:
- Loading state is active
- OTP code is not 6 digits
- Password validation fails

## Error Handling

Common errors:
- "Passwords do not match" - Client-side validation
- "Password does not meet requirements" - Client-side validation
- "Invalid OTP code" - Server-side validation
- "Email not found" - Server-side validation
- "2FA not configured" - Server-side validation

## Success State

After successful password reset:
1. Form is hidden
2. Success icon (✅) displayed
3. Success message shown
4. 3-second countdown message
5. Automatic redirect to login page

## Based On

This implementation is adapted from the web folder's `ResetPasswordPage.tsx`, maintaining the same functionality and user experience while being integrated into the Next.js app structure.

