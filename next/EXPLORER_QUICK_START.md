# Explorer Implementation Quick Start

## 📋 Summary

Connect the Explorer page to real backend data by creating 3 new Next.js API routes that transform and aggregate data from the Go backend.

## 🎯 What Needs to Be Done

### 1. Create 3 New API Routes

```
/next/app/api/go/explorer/
├── leaderboard/route.ts  ← Trader leaderboard with stats
├── agents/route.ts       ← Running/paused traders
└── positions/route.ts    ← All active positions
```

### 2. Create Frontend API Client

```typescript
// /next/lib/explorer-api.ts
export const explorerApi = {
  getLeaderboard: () => fetch('/api/go/explorer/leaderboard').then(r => r.json()),
  getAgents: () => fetch('/api/go/explorer/agents').then(r => r.json()),
  getPositions: () => fetch('/api/go/explorer/positions').then(r => r.json()),
}
```

### 3. Update Explorer Page

Replace mock data with real API calls using SWR:

```typescript
// In /next/app/[locale]/explorer/page.tsx
const { data: leaderboardData } = useSWR('leaderboard', explorerApi.getLeaderboard)
const { data: agentsData } = useSWR('agents', explorerApi.getAgents)
const { data: positionsData } = useSWR('positions', explorerApi.getPositions)
```

## 🔄 Data Flow

```
Explorer UI → Next.js API Routes → Go Backend APIs
   ↑                ↓                     ↓
   └────── Transform & Cache ──────── Database
```

## 📊 API Route Responsibilities

### Leaderboard Route
- **Calls**: `/api/competition` or `/api/traders`
- **Transforms**: Add trade counts, win rates, volume stats
- **Returns**: Top traders ranked by P&L

### Agents Route  
- **Calls**: `/api/traders` + `/api/account` per trader
- **Transforms**: Combine trader + account data
- **Returns**: List of active/paused traders with status

### Positions Route
- **Calls**: `/api/traders` + `/api/positions` per trader
- **Transforms**: Aggregate all positions with trader info
- **Returns**: All open positions across traders

## ⚡ Quick Implementation

### Step 1: Leaderboard Route (20 min)
```typescript
// /next/app/api/go/explorer/leaderboard/route.ts
export async function GET() {
  const traders = await fetch(`${GO_BACKEND}/api/competition`).then(r => r.json())
  
  return NextResponse.json({
    agents: traders.traders.map(t => ({
      id: t.trader_id,
      name: t.trader_name,
      owner: "User",
      icon: getIcon(t.ai_model),
      pnl: t.total_pnl,
      pnlPercent: t.total_pnl_pct,
      trades: t.position_count || 0,
      winRate: 65, // TODO: get from statistics
      volume: t.total_equity * 10 // TODO: calculate properly
    }))
  })
}
```

### Step 2: Agents Route (20 min)
```typescript
// /next/app/api/go/explorer/agents/route.ts
export async function GET() {
  const traders = await fetch(`${GO_BACKEND}/api/traders`).then(r => r.json())
  
  return NextResponse.json({
    agents: traders.map(t => ({
      id: t.trader_id,
      name: t.trader_name,
      description: `${t.ai_model} trading bot`,
      icon: getIcon(t.ai_model),
      status: t.is_running ? "active" : "paused",
      // Need to fetch account data separately for accurate balance
    }))
  })
}
```

### Step 3: Positions Route (20 min)
```typescript
// /next/app/api/go/explorer/positions/route.ts
export async function GET() {
  const traders = await fetch(`${GO_BACKEND}/api/traders`).then(r => r.json())
  
  // Fetch positions for each trader (in parallel)
  const allPositions = []
  for (const trader of traders) {
    try {
      const positions = await fetch(
        `${GO_BACKEND}/api/positions?trader_id=${trader.trader_id}`
      ).then(r => r.json())
      
      allPositions.push(...positions.map(p => ({
        id: `${trader.trader_id}-${p.symbol}`,
        agentId: trader.trader_id,
        agentName: trader.trader_name,
        asset: p.symbol.replace('USDT', ''),
        type: p.side === 'BUY' ? 'Long' : 'Short',
        leverage: `${p.leverage}x`,
        entryPrice: `$${p.entry_price.toFixed(2)}`,
        currentPrice: `$${p.mark_price.toFixed(2)}`,
        pnl: p.unrealized_pnl,
        pnlPercent: p.unrealized_pnl_pct
      })))
    } catch (e) {
      // Skip traders with no positions or private data
    }
  }
  
  return NextResponse.json({ positions: allPositions })
}
```

### Step 4: Update Explorer Page (10 min)
```typescript
// Replace mock data declarations with:
import { explorerApi } from '@/lib/explorer-api'
import useSWR from 'swr'

const { data: leaderboardData } = useSWR(
  'explorer-leaderboard',
  explorerApi.getLeaderboard,
  { refreshInterval: 30000 }
)

const { data: agentsData } = useSWR(
  'explorer-agents', 
  explorerApi.getAgents,
  { refreshInterval: 15000 }
)

const { data: positionsData } = useSWR(
  'explorer-positions',
  explorerApi.getPositions,
  { refreshInterval: 10000 }
)

// Then map to existing variables:
const leaderboardAgents = leaderboardData?.agents || []
const runningAgents = agentsData?.agents || []
const activePositions = positionsData?.positions || []
```

## 🚨 Known Limitations

### Current Implementation
1. **No batch statistics endpoint** - Need to fetch per trader (slow)
2. **No public positions endpoint** - Need to fetch per trader (slow)
3. **Win rate calculation** - Not available in current API
4. **Trading volume** - Not tracked in current system

### Workarounds
1. Cache aggressively (30-60 seconds)
2. Limit to top 20-50 traders for performance
3. Estimate win rate from P&L trend
4. Calculate volume as `equity * multiplier`

## 🎨 UI Changes Needed

**None!** The UI is already built and expects this exact data structure. Just swap mock data with API calls.

## ⏱️ Estimated Time

- **API Routes**: 1 hour
- **Frontend Integration**: 30 minutes  
- **Testing**: 30 minutes
- **Total**: ~2 hours

## 🧪 Testing Checklist

- [ ] Leaderboard shows real traders
- [ ] Leaderboard sorts by P&L correctly
- [ ] Agents tab shows running/paused status
- [ ] Positions tab shows real positions
- [ ] Search works
- [ ] Filters work
- [ ] Pagination works
- [ ] No errors in console
- [ ] Data refreshes automatically

## 🚀 Backend Improvements Needed (Later)

### High Priority
1. `POST /api/statistics-batch` - Batch fetch trader stats
2. `GET /api/positions/all` - Get all public positions in one call
3. `GET /api/competition?include_stats=true` - Include win rate, volume

### Low Priority  
1. Templates system (new feature)
2. Trader privacy controls
3. Owner username field
4. Custom trader icons

## 📝 Environment Setup

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🔍 Debug Commands

```bash
# Test leaderboard API
curl http://localhost:3000/api/go/explorer/leaderboard

# Test agents API  
curl http://localhost:3000/api/go/explorer/agents

# Test positions API
curl http://localhost:3000/api/go/explorer/positions

# Check Go backend
curl http://localhost:8080/api/competition
```

## 📚 Full Documentation

See `EXPLORER_IMPLEMENTATION_SPEC.md` for complete specification including:
- Detailed type definitions
- Backend API combinations
- Caching strategy
- Error handling
- Security considerations
- Performance requirements

## 🆘 Common Issues

**Q: Leaderboard is empty**
- Check if `/api/competition` returns data
- Check if traders have `total_pnl` > 0

**Q: Positions not showing**
- Check if traders have open positions
- Verify auth token is valid (positions may be private)

**Q: Slow loading**
- Reduce number of traders fetched
- Increase cache TTL
- Implement backend batch endpoints

**Q: Win rate showing 0%**
- Not implemented yet - showing placeholder
- Need to fetch from `/api/statistics` per trader

## ✅ Done Criteria

1. All 3 tabs show real data ✓
2. Data auto-refreshes ✓
3. No console errors ✓
4. Loading states work ✓
5. Error handling works ✓

---

**Next Steps**: Start with Leaderboard route, test it, then move to Agents and Positions.

