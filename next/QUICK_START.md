# Quick Start Guide - Authentication System

## Setup in 5 Minutes

### Step 1: Configure Environment

Create `next/.env.local`:

```env
GO_API_URL=http://localhost:8080
```

### Step 2: Start Go Backend

```bash
# In project root
go run main.go
```

Expected output:
```
Server starting on :8080
```

### Step 3: Start Next.js

```bash
# In next/ directory
npm install
npm run dev
```

Expected output:
```
Ready on http://localhost:3000
```

### Step 4: Test the System

Visit any of these URLs:

- **Login**: http://localhost:3000/en/auth/password/login
- **Register**: http://localhost:3000/en/auth/password/register
- **Reset Password**: http://localhost:3000/en/auth/password/reset-password

## Quick Test

### Test System Connection

```bash
curl http://localhost:3000/api/go/system-config
```

Expected response:
```json
{
  "beta_mode": false,
  "app_name": "Ryu"
}
```

### Test Login API

```bash
curl -X POST http://localhost:3000/api/go/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

## File Structure Overview

```
next/
├── app/
│   ├── [locale]/auth/password/
│   │   ├── login/page.tsx          # Password login
│   │   ├── register/page.tsx       # Registration
│   │   └── reset-password/page.tsx # Password reset
│   └── api/go/                     # API proxy to Go backend
│       ├── login/route.ts
│       ├── register/route.ts
│       └── ... (8 routes total)
└── contexts/
    └── password-auth-context.tsx   # Auth state management
```

## Common Issues

### "Connection Refused"

**Problem**: Can't connect to Go backend

**Solution**: 
1. Make sure Go backend is running on port 8080
2. Check `GO_API_URL` in `.env.local`
3. Restart Next.js dev server

### "404 Not Found"

**Problem**: API routes return 404

**Solution**:
1. Verify file exists in `/app/api/go/`
2. Clear Next.js cache: `rm -rf .next`
3. Restart dev server

### Environment Variable Not Working

**Problem**: `GO_API_URL` not being read

**Solution**:
1. File must be named `.env.local` (not `.env`)
2. File must be in `next/` directory
3. Restart dev server after changes

## Next Steps

1. ✅ Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for complete overview
2. ✅ Read [/app/api/go/README.md](./app/api/go/README.md) for API documentation
3. ✅ Read [/app/[locale]/auth/README.md](./app/[locale]/auth/README.md) for auth pages
4. ✅ Configure production environment variables
5. ✅ Test all authentication flows
6. ✅ Deploy to production

## Production Deployment

### Environment Variables

Production `.env.production`:
```env
GO_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Deployment Checklist

- [ ] Set `GO_API_URL` to production backend URL
- [ ] Use HTTPS for all API communication
- [ ] Configure CORS on Go backend
- [ ] Test all authentication flows
- [ ] Verify token storage and sessions
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

## Support

For detailed documentation, see:
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- [/app/api/go/README.md](./app/api/go/README.md)
- [/app/api/go/CONFIGURATION.md](./app/api/go/CONFIGURATION.md)

