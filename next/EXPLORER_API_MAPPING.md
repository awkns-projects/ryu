# Explorer API Mapping - Complete Reference

## Overview

This document maps Explorer UI features to actual backend APIs from `api/server.go`.

---

## Current Backend APIs (from server.go)

### Public APIs (No Authentication)

| Endpoint | Handler | Returns | Used For |
|----------|---------|---------|----------|
| `GET /api/competition` | `handlePublicCompetition` | All traders with P&L data | Leaderboard, Agents |
| `GET /api/traders` | `handlePublicTraderList` | Same as competition | Alternative source |
| `GET /api/top-traders` | `handleTopTraders` | Top 5 traders only | Performance charts |
| `POST /api/equity-history-batch` | `handleEquityHistoryBatch` | Historical P&L for multiple traders | Charts |
| `GET /api/equity-history?trader_id=xxx` | `handleEquityHistory` | Historical P&L for one trader | Single trader chart |
| `GET /api/traders/:id/public-config` | `handleGetPublicTraderConfig` | Public trader info | Trader details |

### Protected APIs (Require Authentication)

| Endpoint | Handler | Returns | Cannot Use |
|----------|---------|---------|------------|
| `GET /api/positions?trader_id=xxx` | `handlePositions` | Positions for one trader | ❌ Need auth |
| `GET /api/statistics?trader_id=xxx` | `handleStatistics` | Statistics for one trader | ❌ Need auth |
| `GET /api/account?trader_id=xxx` | `handleAccount` | Account info for one trader | ❌ Need auth |
| `GET /api/status?trader_id=xxx` | `handleStatus` | Status for one trader | ❌ Need auth |

---

## Explorer Tabs → Backend API Mapping

### Tab 1: Leaderboard 🏆

**UI Requirements**:
```typescript
interface LeaderboardAgent {
  id: string           // Trader ID
  name: string         // Display name
  owner: string        // Owner name
  model: string        // AI model
  pnl: number          // Total P&L
  roi: number          // ROI %
  trades: number       // Trade count
  winRate: number      // Win rate %
  volume: number       // Trading volume
  icon: string         // Emoji icon
}
```

**Backend API**:
```
GET http://localhost:8080/api/competition
```

**Response Structure**:
```json
{
  "traders": [
    {
      "trader_id": "binance_deepseek_123",
      "trader_name": "Momentum Master",
      "ai_model": "deepseek",
      "exchange": "binance",
      "total_equity": 11000,
      "total_pnl": 1000,
      "total_pnl_pct": 10.0,
      "position_count": 5,
      "margin_used_pct": 45.2,
      "is_running": true
    }
  ],
  "count": 1
}
```

**Data Transformation**:
```typescript
const leaderboardAgent: LeaderboardAgent = {
  id: trader.trader_id,
  name: trader.trader_name,
  owner: parseOwner(trader.trader_name), // Extract from name or "Anonymous"
  model: trader.ai_model,
  pnl: trader.total_pnl,
  roi: trader.total_pnl_pct,
  trades: trader.position_count,        // ⚠️ Not real trade count
  winRate: estimateWinRate(trader),     // ⚠️ Estimated formula
  volume: estimateVolume(trader),       // ⚠️ Estimated formula
  icon: getModelIcon(trader.ai_model)
}
```

**Limitations** (can fix with backend Priority 2):
- `trades`: Using `position_count` (not real trade count)
- `winRate`: Estimated from P&L (not real win rate)
- `volume`: Estimated formula (not real volume)

**Frontend API Route**:
```
GET /api/go/explorer/leaderboard
```

---

### Tab 2: Running Agents 🤖

**UI Requirements**:
```typescript
interface RunningAgent {
  id: string
  name: string
  description: string
  model: string
  status: "active" | "paused"
  deposit: number
  pnl: number
  roi: number
  trades: number
}
```

**Backend API**:
```
GET http://localhost:8080/api/competition
```
(Same as Leaderboard - single API call)

**Data Transformation**:
```typescript
const runningAgent: RunningAgent = {
  id: trader.trader_id,
  name: trader.trader_name,
  description: `${trader.ai_model} AI trading on ${trader.exchange}`,
  model: trader.ai_model,
  status: trader.is_running ? "active" : "paused",
  deposit: trader.total_equity,     // ⚠️ Not real initial balance
  pnl: trader.total_pnl,
  roi: trader.total_pnl_pct,
  trades: trader.position_count
}
```

**Limitations** (can fix with backend Priority 2):
- `deposit`: Using `total_equity` (not initial_balance)

**Frontend API Route**:
```
GET /api/go/explorer/agents
```

---

### Tab 3: Active Positions 📊

**UI Requirements**:
```typescript
interface ActivePosition {
  id: string
  agentId: string
  agentName: string
  asset: string        // e.g., "BTC"
  type: "Long" | "Short"
  size: number
  leverage: string     // e.g., "10x"
  entryPrice: number
  currentPrice: number
  pnl: number
  roi: number
}
```

**Backend API**:
```
❌ DOES NOT EXIST - Need to add
```

**Required New Endpoint**:
```
GET http://localhost:8080/api/positions/all
```

**Expected Response**:
```json
{
  "positions": [
    {
      "trader_id": "binance_deepseek_123",
      "trader_name": "Momentum Master",
      "symbol": "BTCUSDT",
      "side": "BUY",
      "entry_price": 43250.00,
      "mark_price": 45120.00,
      "quantity": 0.1,
      "leverage": 10,
      "unrealized_pnl": 187.00,
      "unrealized_pnl_pct": 18.7,
      "liquidation_price": 39000.00,
      "margin_used": 432.50
    }
  ],
  "count": 1
}
```

**Data Transformation**:
```typescript
const activePosition: ActivePosition = {
  id: `${pos.trader_id}-${pos.symbol}`,
  agentId: pos.trader_id,
  agentName: pos.trader_name,
  asset: pos.symbol.replace('USDT', '').replace('PERP', ''),
  type: pos.side === "BUY" ? "Long" : "Short",
  size: pos.quantity,
  leverage: `${pos.leverage}x`,
  entryPrice: pos.entry_price,
  currentPrice: pos.mark_price,
  pnl: pos.unrealized_pnl,
  roi: pos.unrealized_pnl_pct
}
```

**Frontend API Route**:
```
GET /api/go/explorer/positions
```

**Status**: ⚠️ **BLOCKED** - Backend endpoint doesn't exist

**Workaround Options**:
1. Show mock data with "Coming Soon" message
2. Implement backend Priority 1 (recommended)

---

### Tab 4: Templates 📋

**Status**: 🔮 **Future Feature**

**Backend API**: TBD (not part of current scope)

**Current Strategy**: Show mock templates

---

## Implementation Summary

### What Works NOW ✅

**Tabs that can be implemented immediately**:
1. ✅ Leaderboard - Using `/api/competition`
2. ✅ Running Agents - Using `/api/competition`

**Single API Call**:
```typescript
// One call gets ALL data for 2 tabs
const response = await fetch('http://localhost:8080/api/competition')
const data = await response.json()

// Use for both Leaderboard and Agents tabs
const leaderboardData = transformToLeaderboard(data.traders)
const agentsData = transformToAgents(data.traders)
```

### What's Blocked ❌

**Tabs that CANNOT be implemented**:
3. ❌ Positions - Requires new backend endpoint

**Root Cause**: `/api/positions?trader_id={id}` requires authentication

**Solution**: Add `/api/positions/all` to backend (see EXPLORER_BACKEND_CHANGES.md)

---

## Next.js API Routes Implementation

### 1. Leaderboard API Route

**File**: `next/app/api/go/explorer/leaderboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { LeaderboardAgent } from '@/lib/explorer-types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/competition`, {
      cache: 'no-store',
      next: { revalidate: 30 } // Cache for 30 seconds
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch competition data')
    }
    
    const data = await response.json()
    
    // Transform to LeaderboardAgent format
    const agents: LeaderboardAgent[] = data.traders.map((trader: any) => ({
      id: trader.trader_id,
      name: trader.trader_name,
      owner: parseOwnerFromName(trader.trader_name),
      model: trader.ai_model,
      pnl: trader.total_pnl,
      roi: trader.total_pnl_pct,
      trades: trader.position_count,
      winRate: estimateWinRate(trader.total_pnl_pct, trader.position_count),
      volume: estimateVolume(trader.total_equity, trader.position_count),
      icon: getModelIcon(trader.ai_model)
    }))
    
    // Sort by PnL descending
    agents.sort((a, b) => b.pnl - a.pnl)
    
    return NextResponse.json({
      agents,
      totalCount: agents.length,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}

function estimateWinRate(pnlPct: number, positionCount: number): number {
  if (positionCount === 0) return 0
  // Estimate: higher P&L % = higher win rate
  return Math.min(Math.max(50 + (pnlPct / 2), 0), 100)
}

function estimateVolume(equity: number, positionCount: number): number {
  // Estimate: volume = equity * positions * 10
  return equity * positionCount * 10
}

function parseOwnerFromName(name: string): string {
  // Try to extract owner from name format "Owner's Trader Name"
  const match = name.match(/^([^']+)'s/)
  return match ? match[1] : 'Anonymous'
}

function getModelIcon(model: string): string {
  const icons: Record<string, string> = {
    deepseek: '🤖',
    claude: '🧠',
    gpt4: '🎯',
    gemini: '✨'
  }
  return icons[model.toLowerCase()] || '🤖'
}
```

### 2. Agents API Route

**File**: `next/app/api/go/explorer/agents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { RunningAgent } from '@/lib/explorer-types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/competition`, {
      cache: 'no-store',
      next: { revalidate: 15 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch agents data')
    }
    
    const data = await response.json()
    
    const agents: RunningAgent[] = data.traders.map((trader: any) => ({
      id: trader.trader_id,
      name: trader.trader_name,
      description: `${trader.ai_model} AI trading on ${trader.exchange}`,
      model: trader.ai_model,
      status: trader.is_running ? 'active' : 'paused',
      deposit: trader.total_equity,
      pnl: trader.total_pnl,
      roi: trader.total_pnl_pct,
      trades: trader.position_count
    }))
    
    const activeCount = agents.filter(a => a.status === 'active').length
    
    return NextResponse.json({
      agents,
      totalCount: agents.length,
      activeCount,
      pausedCount: agents.length - activeCount,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents data' },
      { status: 500 }
    )
  }
}
```

### 3. Positions API Route (Placeholder)

**File**: `next/app/api/go/explorer/positions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ActivePosition } from '@/lib/explorer-types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    // ⚠️ This endpoint doesn't exist yet in backend
    const response = await fetch(`${BACKEND_URL}/api/positions/all`, {
      cache: 'no-store',
      next: { revalidate: 10 }
    })
    
    if (!response.ok) {
      // If backend endpoint doesn't exist, return mock data
      return NextResponse.json({
        positions: [],
        totalCount: 0,
        totalValue: 0,
        avgLeverage: 0,
        avgRoi: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Backend endpoint /api/positions/all not implemented yet'
      })
    }
    
    const data = await response.json()
    
    const positions: ActivePosition[] = data.positions.map((pos: any) => ({
      id: `${pos.trader_id}-${pos.symbol}`,
      agentId: pos.trader_id,
      agentName: pos.trader_name,
      asset: pos.symbol.replace('USDT', '').replace('PERP', ''),
      type: pos.side === 'BUY' ? 'Long' : 'Short',
      size: pos.quantity,
      leverage: `${pos.leverage}x`,
      entryPrice: pos.entry_price,
      currentPrice: pos.mark_price,
      pnl: pos.unrealized_pnl,
      roi: pos.unrealized_pnl_pct
    }))
    
    const totalValue = positions.reduce((sum, p) => sum + (p.size * p.currentPrice), 0)
    const avgLeverage = positions.reduce((sum, p) => sum + parseInt(p.leverage), 0) / positions.length
    const avgRoi = positions.reduce((sum, p) => sum + p.roi, 0) / positions.length
    
    return NextResponse.json({
      positions,
      totalCount: positions.length,
      totalValue,
      avgLeverage,
      avgRoi,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Positions API error:', error)
    
    // Return empty data with error message
    return NextResponse.json({
      positions: [],
      totalCount: 0,
      totalValue: 0,
      avgLeverage: 0,
      avgRoi: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Backend endpoint not available'
    })
  }
}
```

---

## Environment Variables

**File**: `next/.env.local`

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Cache settings
NEXT_REVALIDATE_LEADERBOARD=30
NEXT_REVALIDATE_AGENTS=15
NEXT_REVALIDATE_POSITIONS=10
```

---

## Testing the Implementation

### 1. Test Backend APIs

```bash
# Test competition endpoint
curl http://localhost:8080/api/competition | jq

# Test positions endpoint (after backend changes)
curl http://localhost:8080/api/positions/all | jq
```

### 2. Test Frontend APIs

```bash
# Start Next.js dev server
cd next
npm run dev

# Test leaderboard API
curl http://localhost:3000/api/go/explorer/leaderboard | jq

# Test agents API
curl http://localhost:3000/api/go/explorer/agents | jq

# Test positions API
curl http://localhost:3000/api/go/explorer/positions | jq
```

### 3. Test in Browser

```javascript
// Open browser console on http://localhost:3000/en/explorer

// Test leaderboard
fetch('/api/go/explorer/leaderboard')
  .then(r => r.json())
  .then(console.log)

// Test agents
fetch('/api/go/explorer/agents')
  .then(r => r.json())
  .then(console.log)

// Test positions
fetch('/api/go/explorer/positions')
  .then(r => r.json())
  .then(console.log)
```

---

## Error Handling

### Backend Down
```typescript
try {
  const response = await fetch(`${BACKEND_URL}/api/competition`)
  if (!response.ok) throw new Error('Backend error')
} catch (error) {
  return NextResponse.json(
    { error: 'Backend service unavailable', agents: [] },
    { status: 503 }
  )
}
```

### Positions Not Available
```typescript
// Gracefully handle missing positions endpoint
if (!response.ok) {
  return NextResponse.json({
    positions: [],
    error: 'Positions endpoint not yet available'
  })
}
```

---

## Performance Optimization

### Caching Strategy
- **Leaderboard**: 30 seconds (less critical, more data)
- **Agents**: 15 seconds (medium priority)
- **Positions**: 10 seconds (most dynamic data)

### Parallel Fetching
```typescript
// Fetch all data in parallel on page load
const [leaderboard, agents, positions] = await Promise.all([
  fetch('/api/go/explorer/leaderboard'),
  fetch('/api/go/explorer/agents'),
  fetch('/api/go/explorer/positions')
])
```

---

## Summary

### Current Status

| Feature | Status | Backend API | Frontend API |
|---------|--------|-------------|--------------|
| Leaderboard | ✅ Ready | `/api/competition` | `/api/go/explorer/leaderboard` |
| Running Agents | ✅ Ready | `/api/competition` | `/api/go/explorer/agents` |
| Active Positions | ⚠️ Blocked | ❌ Missing | `/api/go/explorer/positions` |
| Templates | 🔮 Future | TBD | TBD |

### Next Steps

1. **Implement frontend APIs** (leaderboard, agents, positions-stub)
2. **Test with real backend** data
3. **Request backend Priority 1** changes for positions
4. **Update positions API** when backend ready
5. **Launch Explorer** with 2 functional tabs

---

## Questions?

See: `EXPLORER_BACKEND_CHANGES.md` for backend implementation details

