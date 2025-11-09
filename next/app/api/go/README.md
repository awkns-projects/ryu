# Go Backend API Proxy Routes

This directory contains Next.js API routes that act as proxies to the Go backend server running on port 8080. These routes handle all authentication-related operations.

## Overview

All routes in this directory forward requests to the Go backend API server and return the responses. This architecture provides:

- **Separation of concerns**: Next.js handles frontend, Go handles business logic
- **Single source of truth**: All authentication logic lives in the Go backend
- **Consistent API**: Same endpoints used by web and next folders
- **Easy deployment**: Can scale frontend and backend independently

## Configuration

### Environment Variable

Set the Go backend URL in your `.env.local` or `.env` file:

```env
GO_API_URL=http://localhost:8080
```

**Default**: `http://localhost:8080` (if not set)

**Production**: Set to your deployed Go backend URL, e.g., `https://api.yourdomain.com`

## Available Routes

### 1. Login (`POST /api/go/auth/login`)

**Purpose**: Authenticate user with email and password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response** (200):
```json
{
  "requires_otp": true,
  "user_id": "user-uuid",
  "message": "Please provide OTP code"
}
```

**Error Response** (400/401):
```json
{
  "error": "Invalid credentials"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/login`

---

### 2. Verify OTP (`POST /api/go/auth/verify-otp`)

**Purpose**: Verify two-factor authentication code during login

**Request Body**:
```json
{
  "user_id": "user-uuid",
  "otp_code": "123456"
}
```

**Success Response** (200):
```json
{
  "token": "jwt-token-string",
  "user_id": "user-uuid",
  "email": "user@example.com",
  "message": "Login successful"
}
```

**Error Response** (400/401):
```json
{
  "error": "Invalid OTP code"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/verify-otp`

---

### 3. Register (`POST /api/go/auth/register`)

**Purpose**: Create a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "beta_code": "abc123"  // Optional, required if beta mode is enabled
}
```

**Success Response** (200):
```json
{
  "user_id": "user-uuid",
  "otp_secret": "base32-secret-key",
  "qr_code_url": "otpauth://totp/...",
  "message": "Registration successful"
}
```

**Error Response** (400):
```json
{
  "error": "Email already exists"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/register`

---

### 4. Complete Registration (`POST /api/go/auth/complete-registration`)

**Purpose**: Complete registration by verifying OTP setup

**Request Body**:
```json
{
  "user_id": "user-uuid",
  "otp_code": "123456"
}
```

**Success Response** (200):
```json
{
  "token": "jwt-token-string",
  "user_id": "user-uuid",
  "email": "user@example.com",
  "message": "Registration completed successfully"
}
```

**Error Response** (400):
```json
{
  "error": "Invalid OTP code"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/complete-registration`

---

### 5. Reset Password (`POST /api/go/auth/reset-password`)

**Purpose**: Reset user password with OTP verification

**Request Body**:
```json
{
  "email": "user@example.com",
  "new_password": "NewSecurePassword123!",
  "otp_code": "123456"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset successful"
}
```

**Error Response** (400/401):
```json
{
  "error": "Invalid OTP code"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/reset-password`

---

### 6. Admin Login (`POST /api/go/auth/admin-login`)

**Purpose**: Authenticate admin users

**Request Body**:
```json
{
  "password": "admin-password"
}
```

**Success Response** (200):
```json
{
  "token": "jwt-token-string",
  "user_id": "admin",
  "email": "admin@localhost"
}
```

**Error Response** (401):
```json
{
  "error": "Invalid admin password"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/admin-login`

---

### 7. Logout (`POST /api/go/auth/logout`)

**Purpose**: Log out user and invalidate session

**Request Headers**:
```
Authorization: Bearer {jwt-token}
```

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Error Response** (401):
```json
{
  "error": "Unauthorized"
}
```

**Go Backend Endpoint**: `POST http://localhost:8080/api/logout`

---

### 8. System Config (`GET /api/go/auth/system-config`)

**Purpose**: Get system configuration (e.g., beta mode status)

**Success Response** (200):
```json
{
  "beta_mode": false,
  "app_name": "Ryu",
  "version": "1.0.0"
}
```

**Error Response** (500):
```json
{
  "error": "Failed to load configuration"
}
```

**Go Backend Endpoint**: `GET http://localhost:8080/api/system-config`

---

## Error Handling

All routes implement consistent error handling:

1. **Network Errors**: If the Go backend is unreachable:
```json
{
  "error": "Failed to connect to authentication service"
}
```
Status: 500

2. **Backend Errors**: Forwards the exact error from Go backend with the same status code

3. **Console Logging**: All errors are logged to the console for debugging

## Implementation Pattern

All routes follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${GO_API_URL}/api/endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to authentication service' },
      { status: 500 }
    );
  }
}
```

## Usage in Frontend

### With PasswordAuthContext

The `password-auth-context.tsx` automatically uses these routes:

```typescript
import { usePasswordAuth } from "@/contexts/password-auth-context";

const { login, register, resetPassword } = usePasswordAuth();

// Login
const result = await login(email, password);

// Register
const result = await register(email, password, betaCode);

// Reset Password
const result = await resetPassword(email, newPassword, otpCode);
```

### Direct Fetch

You can also call the routes directly:

```typescript
const response = await fetch('/api/go/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();
```

## Authentication Flow

### Login Flow
1. User submits email/password → `/api/go/auth/login`
2. If 2FA enabled → User submits OTP → `/api/go/auth/verify-otp`
3. Token stored in localStorage
4. User redirected to dashboard

### Registration Flow
1. User submits email/password → `/api/go/auth/register`
2. QR code displayed for 2FA setup
3. User submits OTP → `/api/go/auth/complete-registration`
4. Token stored in localStorage
5. User redirected to dashboard

### Password Reset Flow
1. User submits email/new password/OTP → `/api/go/auth/reset-password`
2. Password updated in database
3. User redirected to login

## Security Features

1. **HTTPS**: Use HTTPS in production for encrypted communication
2. **CORS**: Configure CORS on Go backend to allow Next.js origin
3. **Token Management**: JWT tokens managed by Go backend
4. **Rate Limiting**: Implement on Go backend to prevent brute force
5. **Input Validation**: Performed on Go backend
6. **OTP Verification**: Time-based one-time passwords for 2FA

## Development

### Starting the Go Backend

```bash
cd /path/to/ryu
go run main.go
```

The Go server should start on port 8080.

### Starting the Next.js Frontend

```bash
cd next
npm run dev
```

The Next.js server starts on port 3000.

### Testing the Connection

```bash
# Test if Go backend is running
curl http://localhost:8080/api/system-config

# Test via Next.js proxy
curl http://localhost:3000/api/go/auth/system-config
```

## Deployment

### Environment Variables

**Development** (`.env.local`):
```env
GO_API_URL=http://localhost:8080
```

**Production** (`.env.production`):
```env
GO_API_URL=https://api.yourdomain.com
```

### Docker Deployment

If using Docker, ensure:
1. Go backend container is named and accessible
2. Use container name in GO_API_URL
3. Both containers are on the same network

Example `docker-compose.yml`:
```yaml
services:
  go-backend:
    build: ./
    ports:
      - "8080:8080"
  
  nextjs-frontend:
    build: ./next
    environment:
      - GO_API_URL=http://go-backend:8080
    ports:
      - "3000:3000"
```

## Troubleshooting

### Connection Refused

**Problem**: `Failed to connect to authentication service`

**Solutions**:
1. Verify Go backend is running on port 8080
2. Check `GO_API_URL` environment variable
3. Ensure no firewall blocking connections
4. Check Go backend logs for errors

### CORS Issues

**Problem**: CORS errors in browser console

**Solution**: Configure CORS in Go backend to allow Next.js origin:
```go
// In Go backend
allowedOrigins := []string{
  "http://localhost:3000",
  "https://yourdomain.com",
}
```

### 404 Not Found

**Problem**: Routes return 404

**Solutions**:
1. Verify Go backend implements the endpoint
2. Check endpoint path matches exactly
3. Ensure Go router is configured correctly

## File Structure

```
next/app/api/go/
├── README.md                      # This file
├── login/
└── auth/
    ├── login/
    │   └── route.ts               # POST /api/go/auth/login
    ├── verify-otp/
    │   └── route.ts               # POST /api/go/auth/verify-otp
    ├── register/
    │   └── route.ts               # POST /api/go/auth/register
    ├── complete-registration/
    │   └── route.ts               # POST /api/go/auth/complete-registration
    ├── reset-password/
    │   └── route.ts               # POST /api/go/auth/reset-password
    ├── admin-login/
    │   └── route.ts               # POST /api/go/auth/admin-login
    ├── logout/
    │   └── route.ts               # POST /api/go/auth/logout
    └── system-config/
        └── route.ts               # GET /api/go/auth/system-config
```

## Related Documentation

- [Authentication Pages](/app/[locale]/auth/README.md)
- [Password Auth Context](/contexts/password-auth-context.tsx)
- [Go Backend API Documentation](/README.md)

