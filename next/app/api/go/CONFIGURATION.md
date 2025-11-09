# Configuration Guide for Go API Proxy

## Environment Variables

Create a `.env.local` file in the `next/` directory with the following variables:

### Required

```env
# Go Backend API URL
GO_API_URL=http://localhost:8080
```

### Optional

```env
# Next.js Public App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Setup

### 1. Start the Go Backend

In the project root directory:

```bash
# Start the Go server
go run main.go
```

The Go backend should start on `http://localhost:8080`

### 2. Configure Next.js

Create `next/.env.local`:

```env
GO_API_URL=http://localhost:8080
```

### 3. Start Next.js Development Server

```bash
cd next
npm install
npm run dev
```

The Next.js server starts on `http://localhost:3000`

### 4. Test the Connection

```bash
# Test Go backend directly
curl http://localhost:8080/api/system-config

# Test via Next.js proxy
curl http://localhost:3000/api/go/auth/system-config
```

## Production Setup

### Environment Configuration

Create `next/.env.production`:

```env
GO_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Docker Deployment

#### docker-compose.yml Example

```yaml
version: '3.8'

services:
  go-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ryu-backend
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
    networks:
      - ryu-network

  nextjs-frontend:
    build:
      context: ./next
      dockerfile: Dockerfile
    container_name: ryu-frontend
    ports:
      - "3000:3000"
    environment:
      - GO_API_URL=http://go-backend:8080
      - NEXT_PUBLIC_APP_URL=https://yourdomain.com
    depends_on:
      - go-backend
    networks:
      - ryu-network

networks:
  ryu-network:
    driver: bridge
```

### Vercel Deployment

1. Deploy Go backend to your hosting provider (e.g., Google Cloud Run, AWS ECS)
2. Get the backend URL (e.g., `https://api.yourdomain.com`)
3. In Vercel, add environment variable:
   - Key: `GO_API_URL`
   - Value: `https://api.yourdomain.com`

### Netlify Deployment

Add to `netlify.toml`:

```toml
[build.environment]
  GO_API_URL = "https://api.yourdomain.com"
```

Or set in Netlify dashboard: Site Settings → Environment Variables

## Testing

### Health Check

```bash
# Test system config endpoint
curl http://localhost:3000/api/go/auth/system-config
```

Expected response:
```json
{
  "beta_mode": false,
  "app_name": "Ryu"
}
```

### Login Test

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/go/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Issue: Connection Refused

**Error**: `Failed to connect to authentication service`

**Solutions**:
1. Verify Go backend is running:
   ```bash
   curl http://localhost:8080/api/system-config
   ```

2. Check environment variable:
   ```bash
   # In next/ directory
   cat .env.local
   ```

3. Restart Next.js dev server:
   ```bash
   npm run dev
   ```

### Issue: CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**: Configure CORS in Go backend to allow Next.js origin

In Go backend:
```go
import "github.com/gin-gonic/gin"
import "github.com/gin-contrib/cors"

router := gin.Default()

// Configure CORS
config := cors.DefaultConfig()
config.AllowOrigins = []string{
  "http://localhost:3000",
  "https://yourdomain.com",
}
config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}

router.Use(cors.New(config))
```

### Issue: 404 Not Found

**Error**: API routes return 404

**Solutions**:
1. Verify endpoint exists in Go backend
2. Check route path matches exactly
3. Ensure Next.js API routes are built:
   ```bash
   npm run build
   npm start
   ```

### Issue: Environment Variable Not Working

**Problem**: `GO_API_URL` not being read

**Solutions**:
1. Restart Next.js dev server after changing `.env.local`
2. Check file name is exactly `.env.local`
3. Verify file is in `next/` directory
4. Check for syntax errors in `.env.local`

## Security Considerations

### Development

- Use `http://localhost` for local development
- Never commit `.env.local` to version control
- Use different ports for frontend (3000) and backend (8080)

### Production

- Always use HTTPS for `GO_API_URL` in production
- Set secure CORS policies on Go backend
- Use environment variables, never hardcode URLs
- Implement rate limiting on Go backend
- Use JWT tokens with short expiration times
- Store tokens securely (httpOnly cookies or secure localStorage)

## Load Balancing

If running multiple Go backend instances:

### Using Nginx

```nginx
upstream go_backend {
    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}

server {
    location /api/ {
        proxy_pass http://go_backend;
    }
}
```

Set in Next.js:
```env
GO_API_URL=https://api.yourdomain.com
```

### Using AWS ALB

1. Create Application Load Balancer
2. Add Go backend instances as targets
3. Get ALB DNS name
4. Set in Next.js:
```env
GO_API_URL=https://your-alb-dns-name.amazonaws.com
```

## Monitoring

### Logging

API routes log errors to console. In production, use a logging service:

```typescript
// In route.ts files
console.error('API error:', error);

// Consider adding:
// - Sentry
// - Datadog
// - CloudWatch
// - Custom logging service
```

### Health Checks

Create a health check endpoint:

```typescript
// next/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';
  
  try {
    const response = await fetch(`${GO_API_URL}/health`);
    const backendHealthy = response.ok;
    
    return NextResponse.json({
      status: 'ok',
      backend: backendHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      backend: 'disconnected',
      error: 'Cannot connect to backend',
    }, { status: 503 });
  }
}
```

Access at: `http://localhost:3000/api/health`

