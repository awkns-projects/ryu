# Explorer Page Implementation Specification

## Overview
This document specifies the implementation of real data fetching for the Explorer page (`/next/app/[locale]/explorer/page.tsx`). The page currently uses mock data and needs to be connected to the Go backend APIs.

## Current State Analysis

### Explorer Page Structure
The explorer page has 4 tabs:
1. **Leaderboard** - Shows top performing AI traders ranked by P&L
2. **Running Agents** - Shows currently active/paused traders
3. **Active Positions** - Shows all open positions across traders
4. **Templates** - Shows available trading strategy templates (future feature)

### Existing Backend APIs (from `/web/src/lib/api.ts`)

#### Available Endpoints:
1. `GET /api/traders` - Get public traders list (no auth required)
2. `GET /api/competition` - Get competition data with trader metrics (no auth required)
3. `GET /api/top-traders` - Get top 5 traders (no auth required)
4. `GET /api/positions?trader_id={id}` - Get positions for specific trader (auth required)
5. `GET /api/account?trader_id={id}` - Get account info for specific trader (auth required)
6. `GET /api/equity-history-batch` - Get batch equity history (no auth required)
7. `GET /api/statistics?trader_id={id}` - Get statistics for specific trader (auth required)

## Available Backend APIs (from server.go)

### Public APIs (No Auth Required)
1. `GET /api/competition` - Competition data with all traders
2. `GET /api/traders` - Public trader list (same as competition)
3. `GET /api/top-traders` - Top 5 traders only
4. `POST /api/equity-history-batch` - Batch historical data
5. `GET /api/equity-history?trader_id=xxx` - Single trader history
6. `GET /api/traders/:id/public-config` - Public trader config

### Protected APIs (Auth Required)
7. `GET /api/status?trader_id=xxx` - Trader status
8. `GET /api/account?trader_id=xxx` - Account info
9. `GET /api/positions?trader_id=xxx` - Positions
10. `GET /api/statistics?trader_id=xxx` - Statistics (win rate, trades)

### Key Limitation
**The Explorer must be PUBLIC**, so we can only use endpoints 1-6. We CANNOT access positions or statistics for public users.

---

## Required New API Routes

### 1. Explorer Leaderboard Data API
**Route**: `/next/app/api/go/explorer/leaderboard/route.ts`

**Purpose**: Aggregate trader data with enhanced metrics for leaderboard display

**Backend Endpoint**: `GET http://localhost:8080/api/competition`

**Available Data** (from competition endpoint):
```typescript
interface CompetitionResponse {
  traders: Array<{
    trader_id: string
    trader_name: string
    ai_model: string
    exchange: string
    total_equity: number
    total_pnl: number
    total_pnl_pct: number
    position_count: number
    margin_used_pct: number
    is_running: boolean
  }>
  count: number
}
```

**Response Type**:
```typescript
interface LeaderboardAgent {
  id: string                // trader_id
  name: string              // trader_name
  owner: string             // owner username or "Anonymous"
  icon: string              // emoji or avatar (derived from ai_model)
  pnl: number              // total_pnl (in USDT)
  pnlPercent: number       // total_pnl_pct
  trades: number           // total trade count (from statistics)
  winRate: number          // win rate percentage (from statistics)
  volume: number           // total trading volume (from statistics)
}

interface LeaderboardResponse {
  agents: LeaderboardAgent[]
  totalCount: number
  lastUpdated: string      // ISO timestamp
}
```

**Data Transformation**:
- Map `CompetitionResponse.traders` to `LeaderboardAgent`
- Use `position_count` as `trades` (actual trade count not available publicly)
- Calculate `winRate` as estimate: `position_count > 0 ? 60 + (total_pnl_pct / 2) : 0` (placeholder)
- Estimate `volume` as: `total_equity * position_count * 10` (placeholder formula)
- Calculate icon emoji based on `ai_model` (e.g., deepseek → 🤖, claude → 🧠, etc.)
- Parse `owner` from trader_name or default to "Anonymous"
- Sort by `total_pnl` descending

**⚠️ Limitations (Public Data Only)**:
- No real `trades` count - using `position_count` as proxy
- No real `winRate` - using estimated formula based on P&L
- No real `volume` - using estimated formula
- To get real data, backend needs to add these fields to `/api/competition`

**Implementation Notes**:
- Publicly accessible (no auth required)
- Cache for 30 seconds to reduce backend load
- No need for additional API calls - all data from `/api/competition`

---

### 2. Explorer Running Agents Data API
**Route**: `/next/app/api/go/explorer/agents/route.ts`

**Purpose**: Get list of running/paused agents with their status and performance

**Backend Endpoint**: `GET http://localhost:8080/api/competition`

**Available Data**: Same as leaderboard (uses competition endpoint)

**Response Type**:
```typescript
interface RunningAgent {
  id: string               // trader_id
  name: string             // trader_name
  description: string      // Generated from ai_model + exchange + strategy
  icon: string             // emoji based on ai_model
  status: "active" | "paused"  // from is_running
  deposit: number          // initial_balance from account
  pnl: number             // total_pnl
  pnlPercent: number      // total_pnl_pct
  trades: number          // position count or trade count
  model: string           // ai_model (e.g., "deepseek", "claude")
  exchange: string        // exchange name
}

interface RunningAgentsResponse {
  agents: RunningAgent[]
  totalCount: number
  activeCount: number
  pausedCount: number
  lastUpdated: string
}
```

**Data Transformation**:
- Get traders from `/api/competition`
- Map status: `is_running === true` → "active", else "paused"
- Use `total_equity` as `deposit` (initial balance not available)
- Use `total_pnl` and `total_pnl_pct` directly
- Use `position_count` as `trades`
- Extract model name from `ai_model` field
- Use `exchange` field directly
- Generate description: `"{model} AI trading on {exchange}"`

**⚠️ Limitations (Public Data Only)**:
- No real `deposit` (initial_balance) - using `total_equity` instead
- No access to scan interval, leverage, or other config
- Can't get detailed account breakdown

**Implementation Notes**:
- Publicly accessible (no auth)
- Cache for 15 seconds
- Returns all traders from competition
- Sort by PnL by default

---

### 3. Explorer Active Positions Data API
**Route**: `/next/app/api/go/explorer/positions/route.ts`

**Purpose**: Aggregate all active positions across all traders

**🚫 CRITICAL LIMITATION**: `/api/positions` requires authentication! Cannot access for public Explorer.

**Current Status**: **NOT IMPLEMENTABLE** without backend changes

**Two Options**:

**Option A: Use Mock Data (Temporary)**
- Show placeholder positions with "Coming Soon" message
- Display aggregate stats from `/api/competition` only
- Show position_count but not actual positions

**Option B: Add New Backend Endpoint (Recommended)**
- Create `GET /api/positions/all` - Public endpoint
- Returns all positions from all traders
- Add to server.go as public endpoint

**If Option B is implemented**:

**Backend Endpoint**: `GET http://localhost:8080/api/positions/all` (NEW, needs to be added)

**Response Type**:
```typescript
interface ActivePosition {
  id: string                // generated: `${trader_id}-${symbol}`
  agentId: string          // trader_id
  agentName: string        // trader_name
  asset: string            // symbol without USDT (e.g., "BTC", "ETH")
  type: "Long" | "Short"   // from side
  leverage: string         // leverage as string (e.g., "10x")
  entryPrice: string       // formatted entry_price with $ and commas
  currentPrice: string     // formatted mark_price
  pnl: number             // unrealized_pnl
  pnlPercent: number      // unrealized_pnl_pct
}

interface ActivePositionsResponse {
  positions: ActivePosition[]
  totalCount: number
  longCount: number
  shortCount: number
  totalPnl: number
  avgRoi: number
  lastUpdated: string
}
```

**Data Transformation** (if backend adds `/api/positions/all`):
- Fetch all positions from single endpoint
- Transform each position:
  - Extract asset name: `symbol.replace('USDT', '').replace('PERP', '')`
  - Map side: "BUY" → "Long", "SELL" → "Short"
  - Format leverage: `${leverage}x`
  - Format prices: `$${price.toLocaleString()}`
  - Calculate P&L from entry vs mark price
- Calculate aggregated stats

**Backend Changes Required**:
```go
// Add to api/server.go
func (s *Server) handlePublicPositions(c *gin.Context) {
    // Get all traders
    allTraders := s.traderManager.GetAllTraders()
    
    positions := []map[string]interface{}{}
    for _, trader := range allTraders {
        traderPositions, err := trader.GetPositions()
        if err == nil {
            for _, pos := range traderPositions {
                positions = append(positions, map[string]interface{}{
                    "trader_id": trader.GetID(),
                    "trader_name": trader.GetName(),
                    "position": pos,
                })
            }
        }
    }
    
    c.JSON(http.StatusOK, gin.H{
        "positions": positions,
        "count": len(positions),
    })
}
```

**Implementation Notes**:
- Publicly accessible (no auth) once backend adds endpoint
- Cache for 10 seconds
- Show mock data until backend is ready
- Limit to 100 most recent positions

---

### 4. Explorer Templates Data API (Future Feature)
**Route**: `/next/app/api/go/explorer/templates/route.ts`

**Purpose**: Get available trading strategy templates

**Status**: **NOT IMPLEMENTED YET** - Backend feature needed

**Recommended Backend Implementation**:
```go
// In Go backend, add new table:
type Template struct {
    ID              string    `json:"id"`
    Title           string    `json:"title"`
    Description     string    `json:"description"`
    IconEmoji       string    `json:"icon"`
    Price           float64   `json:"price"`
    Rating          float64   `json:"rating"`
    UsageCount      int       `json:"usage_count"`
    AgentsCreated   int       `json:"agents_created"`
    Category        string    `json:"category"` // "Trading Bot", "Investment", etc.
    PromptTemplate  string    `json:"prompt_template"`
    DefaultSettings map[string]interface{} `json:"default_settings"`
    CreatedAt       time.Time `json:"created_at"`
}
```

**Response Type**:
```typescript
interface Template {
  id: string
  title: string
  description: string
  icon: string
  image?: string
  price: number
  rating: number
  usageCount: number
  agentsCreated: number
  category: string
}

interface TemplatesResponse {
  templates: Template[]
  totalCount: number
  categories: string[]
  lastUpdated: string
}
```

**Implementation Notes**:
- Mark as "Coming Soon" in UI until backend is ready
- Use mock data temporarily with clear indication

---

## API Route Implementation Pattern

### Standard Next.js API Route Structure

```typescript
// /next/app/api/go/explorer/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GO_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '50'
    const sortBy = searchParams.get('sortBy') || 'pnl'

    // 2. Call Go backend API(s)
    const response = await fetch(`${GO_BACKEND_URL}/api/traders`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()

    // 3. Transform data to match Explorer UI requirements
    const transformedData = transformData(data)

    // 4. Return response with cache headers
    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Explorer API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
      { status: 500 }
    )
  }
}

function transformData(data: any) {
  // Data transformation logic
  return data
}
```

---

## Frontend Integration

### 1. Create API Client Library
**File**: `/next/lib/explorer-api.ts`

```typescript
export interface ExplorerAPI {
  getLeaderboard: (params?: LeaderboardParams) => Promise<LeaderboardResponse>
  getAgents: (params?: AgentsParams) => Promise<RunningAgentsResponse>
  getPositions: (params?: PositionsParams) => Promise<ActivePositionsResponse>
  getTemplates: (params?: TemplatesParams) => Promise<TemplatesResponse>
}

interface LeaderboardParams {
  limit?: number
  sortBy?: 'pnl' | 'trades' | 'winRate' | 'volume'
  minWinRate?: number
  minVolume?: number
}

// Implementation
export const explorerApi: ExplorerAPI = {
  async getLeaderboard(params) {
    const queryString = new URLSearchParams(params as any).toString()
    const response = await fetch(`/api/go/explorer/leaderboard?${queryString}`)
    if (!response.ok) throw new Error('Failed to fetch leaderboard')
    return response.json()
  },
  // ... other methods
}
```

### 2. Update Explorer Page Component
**File**: `/next/app/[locale]/explorer/page.tsx`

```typescript
// Replace mock data with real data fetching
import { explorerApi } from '@/lib/explorer-api'
import useSWR from 'swr'

export default function ExplorerPage() {
  // Replace mock data with SWR hooks
  const { data: leaderboardData, isLoading: leaderboardLoading } = useSWR(
    'leaderboard',
    () => explorerApi.getLeaderboard(),
    { refreshInterval: 30000 } // 30 seconds
  )

  const { data: agentsData, isLoading: agentsLoading } = useSWR(
    'agents',
    () => explorerApi.getAgents(),
    { refreshInterval: 15000 } // 15 seconds
  )

  const { data: positionsData, isLoading: positionsLoading } = useSWR(
    'positions',
    () => explorerApi.getPositions(),
    { refreshInterval: 10000 } // 10 seconds
  )

  // Map to existing UI structure
  const leaderboardAgents = leaderboardData?.agents || []
  const runningAgents = agentsData?.agents || []
  const activePositions = positionsData?.positions || []

  // Rest of component remains the same - UI is already built!
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Explorer Frontend                        │
│                 /app/[locale]/explorer/page.tsx             │
└─────────────────────┬───────────────────────────────────────┘
                      │ useSWR hooks
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│          /app/api/go/explorer/[endpoint]/route.ts           │
│  ┌─────────────┬─────────────┬──────────────┬─────────────┐ │
│  │ leaderboard │   agents    │  positions   │  templates  │ │
│  └──────┬──────┴──────┬──────┴───────┬──────┴──────┬──────┘ │
└─────────┼─────────────┼──────────────┼─────────────┼────────┘
          │             │              │             │
          │             │              │             │
          ↓             ↓              ↓             ↓
┌─────────────────────────────────────────────────────────────┐
│                      Go Backend                              │
│                     (Port 8080)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/competition  │  /api/traders  │  /api/positions│   │
│  │  /api/statistics   │  /api/account  │  /api/top-traders│ │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend API Usage - ACTUAL vs IDEAL

### ✅ What We Can Use NOW (Public APIs)

**Single Endpoint for Everything**:
- `GET /api/competition` - **One call gets ALL data we need**
  - Returns: trader_id, trader_name, ai_model, exchange
  - Returns: total_equity, total_pnl, total_pnl_pct
  - Returns: position_count, margin_used_pct, is_running
  - Available for: Leaderboard + Running Agents tabs

**Historical Data** (for charts):
- `POST /api/equity-history-batch` with `{trader_ids: [...]}`
  - Get historical P&L for multiple traders
  - Used for performance comparison charts

### ❌ What We CANNOT Use (Auth Required)

**Blocked Endpoints**:
- `GET /api/positions?trader_id={id}` - ❌ Auth required
- `GET /api/statistics?trader_id={id}` - ❌ Auth required  
- `GET /api/account?trader_id={id}` - ❌ Auth required

**Impact**:
- **No real positions data** for Positions tab
- **No trade statistics** (win rate, trade count, volume)
- **No account details** (initial balance, available balance)

### 🔧 Backend Endpoints Needed (Future)

**High Priority - Add to server.go**:

1. **Public Positions Endpoint**
```go
api.GET("/positions/all", s.handlePublicPositions)  // NEW
```
Returns all positions from all traders without auth

2. **Enhanced Competition Data**
```go
// Modify handlePublicCompetition to include:
- total_trades: int        // Lifetime trade count
- win_rate: float64       // Win rate percentage  
- total_volume: float64   // Total trading volume
- initial_balance: float64 // Starting capital
```

3. **Public Statistics Endpoint** (optional)
```go
api.GET("/statistics/all", s.handlePublicStatistics)  // NEW
```
Returns aggregated statistics for all traders

### Current Workaround Strategy

**Leaderboard Tab**: ✅ Fully functional
- Data: `/api/competition` 
- Limitation: No real trade count, win rate, volume
- Solution: Use estimated formulas based on P&L

**Running Agents Tab**: ✅ Fully functional
- Data: `/api/competition`
- Limitation: No initial_balance (use total_equity instead)
- Solution: All needed data available

**Positions Tab**: ⚠️ Show mock data or "Coming Soon"
- Data: NONE (positions require auth)
- Limitation: Cannot show any real positions
- Solution: Add `/api/positions/all` to backend OR show mock data

---

## Backend Changes Recommended

### High Priority (Required for MVP):

1. **Batch Statistics Endpoint**
   ```go
   // POST /api/statistics-batch
   type StatisticsBatchRequest struct {
       TraderIDs []string `json:"trader_ids"`
   }
   
   type StatisticsBatchResponse struct {
       Statistics map[string]Statistics `json:"statistics"` // trader_id -> stats
   }
   ```

2. **Public Positions Endpoint**
   ```go
   // GET /api/positions/all
   // Returns all positions from all public traders
   type PublicPositionsResponse struct {
       Positions []PositionWithTrader `json:"positions"`
       TotalCount int `json:"total_count"`
   }
   
   type PositionWithTrader struct {
       TraderID   string `json:"trader_id"`
       TraderName string `json:"trader_name"`
       Position   Position `json:"position"`
   }
   ```

3. **Enhanced Competition Endpoint**
   ```go
   // GET /api/competition?include_stats=true
   // Add optional query param to include trade count, win rate, volume
   type EnhancedCompetitionTraderData struct {
       CompetitionTraderData
       TradeCount  int     `json:"trade_count"`
       WinRate     float64 `json:"win_rate"`
       TotalVolume float64 `json:"total_volume"`
   }
   ```

### Low Priority (Nice to Have):

1. **Templates System** - Complete new feature
2. **Owner Information** - Add owner username to trader data
3. **Trader Icons/Avatars** - Add customizable icons
4. **Public/Private Toggle** - Let users make traders private

---

## Implementation Phases

### Phase 1: Core API Routes (Week 1)
- [x] Analyze existing APIs and create spec
- [ ] Implement `/api/go/explorer/leaderboard/route.ts`
- [ ] Implement `/api/go/explorer/agents/route.ts`
- [ ] Implement `/api/go/explorer/positions/route.ts`
- [ ] Create `explorer-api.ts` client library

### Phase 2: Frontend Integration (Week 1-2)
- [ ] Replace mock data with real data in Explorer page
- [ ] Add loading states and error handling
- [ ] Test with real backend data
- [ ] Add retry logic and fallbacks

### Phase 3: Backend Optimizations (Week 2)
- [ ] Implement batch statistics endpoint in Go
- [ ] Implement public positions endpoint in Go
- [ ] Add caching layer in Go backend
- [ ] Performance testing and optimization

### Phase 4: Polish & Templates (Week 3-4)
- [ ] Implement templates backend system
- [ ] Add owner information
- [ ] Add custom trader icons
- [ ] Implement privacy controls

---

## Testing Strategy

### Unit Tests
- Test data transformation functions
- Test API error handling
- Test query parameter parsing

### Integration Tests
- Test full data flow from backend to UI
- Test with various data states (empty, partial, full)
- Test error scenarios (backend down, timeout, etc.)

### Performance Tests
- Load test with 100+ traders
- Measure API response times
- Test caching effectiveness
- Monitor memory usage during data fetching

---

## Caching Strategy

### Frontend (Next.js)
- SWR with stale-while-revalidate
- Refresh intervals:
  - Leaderboard: 30 seconds
  - Agents: 15 seconds
  - Positions: 10 seconds
  - Templates: 5 minutes

### API Routes (Next.js)
- HTTP cache headers: `s-maxage=30, stale-while-revalidate=60`
- In-memory cache for expensive computations
- Deduplicate concurrent requests

### Backend (Go)
- Redis cache for computed statistics (1 minute TTL)
- Database query result caching
- Rate limiting per IP

---

## Error Handling

### Frontend
```typescript
// Graceful degradation
const leaderboardAgents = leaderboardData?.agents || []

// Error display
{leaderboardError && (
  <div className="error-banner">
    Failed to load leaderboard data. Please try again later.
  </div>
)}

// Loading states
{leaderboardLoading && <LoadingSpinner />}
```

### API Routes
```typescript
try {
  // API call
} catch (error) {
  console.error('API Error:', error)
  return NextResponse.json(
    { 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    { status: 500 }
  )
}
```

---

## Security Considerations

1. **Rate Limiting**: Implement per-IP rate limits on explorer APIs
2. **Data Privacy**: Only expose public trader data
3. **Input Validation**: Validate all query parameters
4. **CORS**: Configure proper CORS headers
5. **API Keys**: No sensitive data in public endpoints
6. **SQL Injection**: Use parameterized queries in Go backend

---

## Monitoring & Analytics

### Metrics to Track
1. API response times (p50, p95, p99)
2. Cache hit rates
3. Error rates by endpoint
4. Number of active users on explorer page
5. Most popular sorting/filtering options

### Logging
- Log all API calls with timestamp and latency
- Log errors with full context
- Monitor backend health checks

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_EXPLORER_CACHE_TTL=30
NEXT_PUBLIC_EXPLORER_MAX_TRADERS=100
```

---

## Success Criteria

### Functional Requirements
- ✅ Leaderboard shows real trader data
- ✅ Running agents shows actual trader status
- ✅ Active positions shows real-time positions
- ✅ Search and filters work with real data
- ✅ Sorting works correctly
- ✅ Pagination works with server data

### Performance Requirements
- ✅ Page load time < 3 seconds
- ✅ API response time < 1 second (p95)
- ✅ No visible lag when switching tabs
- ✅ Smooth scrolling with 100+ items

### Reliability Requirements
- ✅ Graceful error handling
- ✅ No blank screens on API failure
- ✅ Auto-retry on transient failures
- ✅ Works with slow network connections

---

## Appendix

### A. Type Definitions
See `/next/lib/explorer-types.ts` for complete type definitions

### B. API Documentation
See backend API docs at `/docs/api/README.md`

### C. Component Structure
```
/next/app/[locale]/explorer/
├── page.tsx                 # Main explorer page
├── components/
│   ├── LeaderboardTab.tsx
│   ├── AgentsTab.tsx
│   ├── PositionsTab.tsx
│   └── TemplatesTab.tsx
└── loading.tsx             # Loading state
```

### D. Backend Route Structure
```
/next/app/api/go/explorer/
├── leaderboard/
│   └── route.ts
├── agents/
│   └── route.ts
├── positions/
│   └── route.ts
└── templates/
    └── route.ts
```

---

## Questions & Decisions

1. **Q**: Should templates tab use mock data or hide it?
   - **A**: Show "Coming Soon" message with mock data, clear indication it's preview

2. **Q**: How to handle trader privacy?
   - **A**: All competition traders are public by default. Add privacy toggle later.

3. **Q**: What's the maximum number of traders to show?
   - **A**: 100 for leaderboard, all for other tabs with pagination

4. **Q**: Should we show trader's wallet address?
   - **A**: No, privacy concern. Only show trader_name.

5. **Q**: Real-time updates or polling?
   - **A**: Polling with SWR for now. WebSocket in future.

---

## Contact & Support

- **Developer**: Backend Team
- **PM**: Product Team  
- **Design**: UI/UX Team
- **Document Version**: 1.0
- **Last Updated**: 2025-01-XX

