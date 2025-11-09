# Trade Page - Complete Go API Integration Guide

## Overview

This document provides a comprehensive analysis of how to fetch all UI data for the Trade Page from the Go backend API. It maps each UI component to specific API endpoints with detailed examples.

---

## Table of Contents

1. [UI Components Overview](#ui-components-overview)
2. [Go API Endpoints Reference](#go-api-endpoints-reference)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Component-by-Component Mapping](#component-by-component-mapping)
5. [Complete Implementation Examples](#complete-implementation-examples)
6. [Error Handling & Edge Cases](#error-handling--edge-cases)
7. [Performance Optimization](#performance-optimization)

---

## UI Components Overview

The Trade Page consists of three main sections:

### 1. **Account Equity Dashboard** (Lines 409-606)
- **Current Equity Display**: Total account value across all traders
- **P&L Chart**: Visual equity curve over time
- **Stats Grid**: Initial balance, current equity, active agents count

### 2. **Agents Grid** (Lines 608-742)
- **Agent Cards**: Display each trading agent/bot
  - Name, description, status
  - Deposit amount
  - P&L and ROI percentage
  - Trading assets
  - Action buttons (settings, delete)

### 3. **Positions Section** (Lines 744-904)
- **Position Cards**: Display active trading positions
  - Symbol, type (long/short), leverage
  - Entry price, current price
  - Unrealized P&L
  - Stop loss, take profit levels

---

## Go API Endpoints Reference

### Backend File: `/api/server.go`

#### Protected Endpoints (Authentication Required)

| Endpoint | Method | Handler | Line | Purpose |
|----------|--------|---------|------|---------|
| `/api/my-traders` | GET | `handleTraderList` | 127 | Get all traders for authenticated user |
| `/api/positions` | GET | `handlePositions` | 1373 | Get positions for specific trader |
| `/api/account` | GET | `handleAccount` | - | Get account info for trader |
| `/api/status` | GET | `handleStatus` | - | Get trader running status |
| `/api/traders` | POST | `handleCreateTrader` | 129 | Create new trader |
| `/api/traders/:id` | DELETE | `handleDeleteTrader` | 131 | Delete trader |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Trade Page Component                      │
│                     (React Frontend)                         │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ useEffect Hook (on mount)
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│                     Step 1: Fetch Traders                      │
│  GET /api/my-traders (with cookies for auth)                  │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ Returns: Array of trader objects
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│              Step 2: Transform to Agent Interface              │
│  Map backend trader data → Frontend Agent interface            │
│  Calculate: deposit, format P&L, extract assets               │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ For each trader...
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│         Step 3: Fetch Positions (loop for each trader)        │
│  GET /api/positions?trader_id=xxx (with cookies)              │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ Returns: Array of position objects
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│          Step 4: Transform to Position Interface               │
│  Map backend position data → Frontend Position interface       │
│  Convert: side to type, prices to numbers                     │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ setAgents(), setPositions()
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│                     Render UI Components                       │
│  1. Calculate equity curve data                                │
│  2. Render agent cards                                         │
│  3. Render position cards                                      │
└───────────────────────────────────────────────────────────────┘
```

---

## Component-by-Component Mapping

### Component 1: Account Equity Dashboard

#### UI Requirements
```typescript
// UI needs these calculated values:
- totalCapital: Sum of all agent deposits
- totalPnl: Sum of all agent P&L
- currentEquity: totalCapital + totalPnl
- pnlPercent: (totalPnl / totalCapital) * 100
- activeAgentsCount: Count of agents where status === 'active'
```

#### Data Source
**Endpoint**: `GET /api/my-traders`

#### Request Example
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const response = await fetch(`${BACKEND_URL}/api/my-traders`, {
  credentials: 'include', // Important: sends authentication cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

const data = await response.json()
```

#### Response Structure
```json
{
  "traders": [
    {
      "trader_id": "binance_deepseek_momentum_001",
      "trader_name": "Momentum Strategy Bot",
      "ai_model": "deepseek-chat",
      "exchange": "binance",
      "total_equity": 11827.45,
      "total_pnl": 1827.45,
      "total_pnl_pct": 18.27,
      "position_count": 3,
      "margin_used_pct": 45.2,
      "is_running": true,
      "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
      "created_at": "2025-11-01T08:00:00Z"
    },
    {
      "trader_id": "hyperliquid_gpt4_scalper_002",
      "trader_name": "GPT-4 Scalper",
      "ai_model": "gpt-4",
      "exchange": "hyperliquid",
      "total_equity": 5234.80,
      "total_pnl": -265.20,
      "total_pnl_pct": -4.82,
      "position_count": 1,
      "margin_used_pct": 12.5,
      "is_running": false,
      "symbols": ["BTCUSDT"],
      "created_at": "2025-11-05T14:30:00Z"
    }
  ],
  "count": 2
}
```

#### Calculation Logic
```typescript
// From response data:
const traders = data.traders || []

// Calculate totals
const totalCapital = traders.reduce((sum, trader) => {
  const deposit = trader.total_equity - trader.total_pnl
  return sum + deposit
}, 0)

const totalPnl = traders.reduce((sum, trader) => {
  return sum + trader.total_pnl
}, 0)

const currentEquity = totalCapital + totalPnl

const pnlPercent = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0

const activeAgentsCount = traders.filter(t => t.is_running).length

// Results:
// totalCapital = (11827.45 - 1827.45) + (5234.80 - (-265.20)) = 10000 + 5500 = 15,500
// totalPnl = 1827.45 + (-265.20) = 1,562.25
// currentEquity = 15500 + 1562.25 = 17,062.25
// pnlPercent = (1562.25 / 15500) * 100 = 10.08%
// activeAgentsCount = 1 (only first trader is running)
```

#### UI Display
```typescript
// Dashboard displays:
<div>
  <div className="text-4xl">{currentEquity.toFixed(2)} USD</div>
  <div className="text-sm">{pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%</div>
  <div className="text-sm">({totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USD)</div>
</div>

// Stats Grid:
<div>Initial Balance: ${totalCapital.toFixed(2)}</div>
<div>Current Equity: ${currentEquity.toFixed(2)}</div>
<div>Active Agents: {activeAgentsCount} / {traders.length}</div>
```

---

### Component 2: Agents Grid (Agent Cards)

#### UI Requirements
```typescript
// Each agent card needs:
interface Agent {
  id: string              // Unique identifier
  name: string            // Display name
  description: string     // Short description
  status: 'active' | 'paused'
  deposit: number         // Initial investment
  assets: string[]        // Trading symbols
  pnl: string            // Formatted P&L string
  pnlPercent: number     // ROI percentage
  totalActions: number   // Position count
}
```

#### Data Source
**Endpoint**: `GET /api/my-traders` (same as equity dashboard)

#### Data Transformation
```typescript
// Transform backend trader to frontend Agent
const mappedAgents: Agent[] = data.traders.map((trader) => {
  // 1. Calculate initial deposit
  const deposit = trader.total_equity - trader.total_pnl
  
  // 2. Extract trading assets
  const assets = trader.symbols || []
  
  // 3. Format P&L as string
  const pnlValue = trader.total_pnl || 0
  const pnlString = pnlValue >= 0 
    ? `+$${pnlValue.toFixed(2)}` 
    : `-$${Math.abs(pnlValue).toFixed(2)}`

  // 4. Map to Agent interface
  return {
    id: trader.trader_id,
    name: trader.trader_name || 'Unnamed Trader',
    description: `${trader.ai_model} trading on ${trader.exchange}`,
    icon: '🤖',
    status: trader.is_running ? 'active' : 'paused',
    totalActions: trader.position_count || 0,
    createdAt: new Date(trader.created_at || Date.now()),
    templateId: undefined,
    deposit: deposit,
    assets: assets,
    pnl: pnlString,
    pnlPercent: trader.total_pnl_pct || 0,
  }
})
```

#### Example Transformation

**Input** (from `/api/my-traders`):
```json
{
  "trader_id": "binance_deepseek_momentum_001",
  "trader_name": "Momentum Strategy Bot",
  "ai_model": "deepseek-chat",
  "exchange": "binance",
  "total_equity": 11827.45,
  "total_pnl": 1827.45,
  "total_pnl_pct": 18.27,
  "position_count": 3,
  "is_running": true,
  "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  "created_at": "2025-11-01T08:00:00Z"
}
```

**Output** (Agent interface):
```typescript
{
  id: "binance_deepseek_momentum_001",
  name: "Momentum Strategy Bot",
  description: "deepseek-chat trading on binance",
  icon: "🤖",
  status: "active",
  totalActions: 3,
  createdAt: Date("2025-11-01T08:00:00Z"),
  templateId: undefined,
  deposit: 10000.00,        // 11827.45 - 1827.45 = 10000
  assets: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  pnl: "+$1827.45",
  pnlPercent: 18.27
}
```

#### UI Display
```tsx
// Agent card render:
<div className="agent-card">
  <div className="header">
    <h3>{agent.name}</h3>
    <span className={agent.status === 'active' ? 'active' : 'paused'}>
      {agent.status === 'active' ? 'Active' : 'Paused'}
    </span>
  </div>
  
  <p className="description">{agent.description}</p>
  
  <div className="metrics">
    <div>
      <span>Deposit:</span>
      <span>${agent.deposit.toFixed(2)}</span>
    </div>
    
    <div>
      <span>P&L:</span>
      <span className={agent.pnlPercent >= 0 ? 'positive' : 'negative'}>
        {agent.pnl}
        <small>({agent.pnlPercent >= 0 ? '+' : ''}{agent.pnlPercent.toFixed(2)}%)</small>
      </span>
    </div>
    
    <div>
      <span>Assets:</span>
      <span>{agent.assets.join(', ')}</span>
    </div>
  </div>
</div>
```

---

### Component 3: Positions Section

#### UI Requirements
```typescript
// Each position card needs:
interface Position {
  id: string                    // Unique identifier
  symbol: string                // Trading pair (e.g., "BTCUSDT")
  type: 'long' | 'short'       // Position direction
  leverage: number              // Leverage multiplier
  entryPrice: number           // Entry price
  currentPrice: number         // Current mark price
  quantity: number             // Position size
  stopLoss?: number            // Stop loss price (optional)
  takeProfit?: number          // Take profit price (optional)
  pnl: number                  // Unrealized P&L
  pnlPercent: number           // P&L percentage
  status: 'open' | 'closed' | 'liquidated'
  source: 'agent' | 'market'
  agentId: string              // Which agent owns this
  createdAt: Date
}
```

#### Data Source
**Endpoint**: `GET /api/positions?trader_id={trader_id}`

**Note**: This endpoint requires a `trader_id` query parameter, so you must fetch positions **for each trader** separately.

#### Request Example
```typescript
// For each agent/trader, fetch their positions
for (const agent of mappedAgents) {
  try {
    const positionsResponse = await fetch(
      `${BACKEND_URL}/api/positions?trader_id=${agent.id}`,
      {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (positionsResponse.ok) {
      const positionsData = await positionsResponse.json()
      // Transform and collect positions
    }
  } catch (error) {
    console.warn(`Failed to fetch positions for trader ${agent.id}:`, error)
    // Continue with other traders
  }
}
```

#### Response Structure
```json
[
  {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "entry_price": 50000.00,
    "mark_price": 51500.00,
    "quantity": 0.1,
    "leverage": 5,
    "unrealized_pnl": 150.00,
    "unrealized_pnl_pct": 3.0,
    "liquidation_price": 45000.00,
    "margin_used": 1000.00,
    "stop_loss": 49000.00,
    "take_profit": 52000.00,
    "created_at": "2025-11-09T10:30:00Z"
  },
  {
    "symbol": "ETHUSDT",
    "side": "SELL",
    "entry_price": 3100.00,
    "mark_price": 3000.00,
    "quantity": 1.0,
    "leverage": 3,
    "unrealized_pnl": 100.00,
    "unrealized_pnl_pct": 3.23,
    "liquidation_price": 3500.00,
    "margin_used": 1033.33,
    "created_at": "2025-11-09T11:00:00Z"
  }
]
```

#### Data Transformation
```typescript
// Transform backend positions to frontend Position interface
const traderPositions = positionsData.map((pos: any) => ({
  id: `${agent.id}-${pos.symbol}`,  // Create unique ID
  symbol: pos.symbol,
  type: pos.side === 'BUY' ? 'long' : 'short',  // Convert side to type
  leverage: pos.leverage || 1,
  entryPrice: pos.entry_price || 0,
  currentPrice: pos.mark_price || pos.entry_price || 0,
  quantity: pos.quantity || 0,
  stopLoss: pos.stop_loss,        // Optional
  takeProfit: pos.take_profit,     // Optional
  pnl: pos.unrealized_pnl || 0,
  pnlPercent: pos.unrealized_pnl_pct || 0,
  status: 'open' as const,         // Positions from API are open
  source: 'agent' as const,        // From trading agent
  agentId: agent.id,
  createdAt: new Date(pos.created_at || Date.now()),
}))

// Collect all positions
allPositions.push(...traderPositions)
```

#### Example Transformation

**Input** (from `/api/positions?trader_id=binance_deepseek_momentum_001`):
```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "entry_price": 50000.00,
  "mark_price": 51500.00,
  "quantity": 0.1,
  "leverage": 5,
  "unrealized_pnl": 150.00,
  "unrealized_pnl_pct": 3.0,
  "stop_loss": 49000.00,
  "take_profit": 52000.00,
  "created_at": "2025-11-09T10:30:00Z"
}
```

**Output** (Position interface):
```typescript
{
  id: "binance_deepseek_momentum_001-BTCUSDT",
  symbol: "BTCUSDT",
  type: "long",           // BUY → long
  leverage: 5,
  entryPrice: 50000.00,
  currentPrice: 51500.00,
  quantity: 0.1,
  stopLoss: 49000.00,
  takeProfit: 52000.00,
  pnl: 150.00,
  pnlPercent: 3.0,
  status: "open",
  source: "agent",
  agentId: "binance_deepseek_momentum_001",
  createdAt: Date("2025-11-09T10:30:00Z")
}
```

#### UI Display
```tsx
// Position card render:
<div className="position-card">
  <div className="header">
    <h3>{position.symbol}</h3>
    <span className={`badge ${position.type}`}>
      {position.leverage}x {position.type.toUpperCase()}
    </span>
  </div>

  <div className="pnl-section">
    <div className="label">Unrealized PnL</div>
    <div className={position.pnl >= 0 ? 'positive' : 'negative'}>
      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
      <small>({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)</small>
    </div>
  </div>

  <div className="details">
    <div>
      <span>Entry Price:</span>
      <span>${position.entryPrice.toFixed(2)}</span>
    </div>
    <div>
      <span>Current Price:</span>
      <span>${position.currentPrice.toFixed(2)}</span>
    </div>
    <div>
      <span>Quantity:</span>
      <span>{position.quantity.toFixed(4)}</span>
    </div>
    {position.stopLoss && (
      <div>
        <span>Stop Loss:</span>
        <span className="red">${position.stopLoss.toFixed(2)}</span>
      </div>
    )}
    {position.takeProfit && (
      <div>
        <span>Take Profit:</span>
        <span className="green">${position.takeProfit.toFixed(2)}</span>
      </div>
    )}
  </div>
</div>
```

---

## Complete Implementation Examples

### Full Data Fetching Function

```typescript
async function fetchTradingData() {
  try {
    setIsLoading(true)
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

    // ========================
    // STEP 1: Fetch Traders
    // ========================
    const tradersResponse = await fetch(`${BACKEND_URL}/api/my-traders`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!tradersResponse.ok) {
      throw new Error(`Failed to fetch traders: ${tradersResponse.status}`)
    }

    const tradersData = await tradersResponse.json()

    // ========================
    // STEP 2: Transform Traders to Agents
    // ========================
    const mappedAgents: Agent[] = tradersData.traders?.map((trader: any) => {
      // Calculate deposit (initial balance)
      const deposit = trader.total_equity - trader.total_pnl
      
      // Extract trading assets
      const assets = trader.symbols || []
      
      // Format P&L string
      const pnlValue = trader.total_pnl || 0
      const pnlString = pnlValue >= 0 
        ? `+$${pnlValue.toFixed(2)}` 
        : `-$${Math.abs(pnlValue).toFixed(2)}`

      return {
        id: trader.trader_id,
        name: trader.trader_name || 'Unnamed Trader',
        description: `${trader.ai_model} trading on ${trader.exchange}`,
        icon: '🤖',
        status: trader.is_running ? 'active' : 'paused',
        totalActions: trader.position_count || 0,
        createdAt: new Date(trader.created_at || Date.now()),
        templateId: undefined,
        deposit: deposit,
        assets: assets,
        pnl: pnlString,
        pnlPercent: trader.total_pnl_pct || 0,
      }
    }) || []

    setAgents(mappedAgents)

    // ========================
    // STEP 3: Fetch Positions for Each Trader
    // ========================
    const allPositions: Position[] = []
    
    for (const agent of mappedAgents) {
      try {
        const positionsResponse = await fetch(
          `${BACKEND_URL}/api/positions?trader_id=${agent.id}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json()
          
          // ========================
          // STEP 4: Transform Positions
          // ========================
          const traderPositions = positionsData.map((pos: any) => ({
            id: `${agent.id}-${pos.symbol}`,
            symbol: pos.symbol,
            type: pos.side === 'BUY' ? 'long' : 'short',
            leverage: pos.leverage || 1,
            entryPrice: pos.entry_price || 0,
            currentPrice: pos.mark_price || pos.entry_price || 0,
            quantity: pos.quantity || 0,
            stopLoss: pos.stop_loss,
            takeProfit: pos.take_profit,
            pnl: pos.unrealized_pnl || 0,
            pnlPercent: pos.unrealized_pnl_pct || 0,
            status: 'open' as const,
            source: 'agent' as const,
            agentId: agent.id,
            createdAt: new Date(pos.created_at || Date.now()),
          }))

          allPositions.push(...traderPositions)
        }
      } catch (posErr) {
        console.warn(`Failed to fetch positions for trader ${agent.id}:`, posErr)
        // Continue with other traders
      }
    }

    setPositions(allPositions)
    setError(null)

  } catch (err: any) {
    console.error('❌ Error fetching trading data:', err)
    setError(err.message || 'Failed to load data')
  } finally {
    setIsLoading(false)
  }
}
```

### Calculate Dashboard Metrics

```typescript
function calculateDashboardMetrics(agents: Agent[]) {
  // Calculate total capital (sum of all deposits)
  const totalCapital = agents.reduce((sum, agent) => {
    return sum + (agent.deposit || 0)
  }, 0)

  // Calculate total P&L
  const totalPnl = agents.reduce((sum, agent) => {
    const pnlValue = parseFloat(agent.pnl?.replace(/[^0-9.-]/g, '') || '0')
    return sum + pnlValue
  }, 0)

  // Calculate current equity
  const currentEquity = totalCapital + totalPnl

  // Calculate P&L percentage
  const pnlPercent = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0

  // Count active agents
  const activeAgentsCount = agents.filter(a => a.status === 'active').length

  return {
    totalCapital,
    totalPnl,
    currentEquity,
    pnlPercent,
    activeAgentsCount,
    totalAgents: agents.length,
  }
}

// Usage in component:
const metrics = calculateDashboardMetrics(agents)

// Display:
<div className="dashboard">
  <div className="equity">${metrics.currentEquity.toFixed(2)}</div>
  <div className="pnl">
    {metrics.pnlPercent >= 0 ? '+' : ''}{metrics.pnlPercent.toFixed(2)}%
    <span>({metrics.totalPnl >= 0 ? '+' : ''}${metrics.totalPnl.toFixed(2)})</span>
  </div>
  <div className="stats">
    <div>Initial: ${metrics.totalCapital.toFixed(2)}</div>
    <div>Current: ${metrics.currentEquity.toFixed(2)}</div>
    <div>Active: {metrics.activeAgentsCount} / {metrics.totalAgents}</div>
  </div>
</div>
```

---

## Error Handling & Edge Cases

### 1. Authentication Errors

```typescript
try {
  const response = await fetch(`${BACKEND_URL}/api/my-traders`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 401) {
    // User is not authenticated
    router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/trade`)}`)
    return
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  // Process data...
  
} catch (error) {
  console.error('Failed to fetch traders:', error)
  setError('Failed to load trading data. Please try again.')
}
```

### 2. Empty Data States

```typescript
// No traders case:
if (!data.traders || data.traders.length === 0) {
  setAgents([])
  setPositions([])
  // UI will show empty state
  return
}

// Trader with no positions:
for (const agent of mappedAgents) {
  const positionsResponse = await fetch(...)
  
  if (positionsResponse.ok) {
    const positionsData = await positionsResponse.json()
    
    if (!positionsData || positionsData.length === 0) {
      // This agent has no positions - that's OK
      continue
    }
    
    // Process positions...
  }
}
```

### 3. Missing or Invalid Data

```typescript
// Safe data access with fallbacks:
const mappedAgents = traders.map(trader => ({
  id: trader.trader_id || `trader-${Date.now()}`,
  name: trader.trader_name || 'Unnamed Trader',
  deposit: (trader.total_equity || 0) - (trader.total_pnl || 0),
  assets: Array.isArray(trader.symbols) ? trader.symbols : [],
  pnl: trader.total_pnl 
    ? (trader.total_pnl >= 0 ? `+$${trader.total_pnl.toFixed(2)}` : `-$${Math.abs(trader.total_pnl).toFixed(2)}`)
    : '$0.00',
  pnlPercent: trader.total_pnl_pct || 0,
  status: trader.is_running === true ? 'active' : 'paused',
  // ... other fields with fallbacks
}))
```

### 4. Network Errors

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      
      if (response.status >= 500 && i < maxRetries - 1) {
        // Server error, retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Usage:
const response = await fetchWithRetry(`${BACKEND_URL}/api/my-traders`, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
})
```

---

## Performance Optimization

### 1. Parallel Position Fetching

Instead of sequential fetching, fetch all positions in parallel:

```typescript
// ❌ Sequential (slow):
for (const agent of mappedAgents) {
  await fetchPositions(agent.id)  // Waits for each
}

// ✅ Parallel (fast):
const positionPromises = mappedAgents.map(agent => 
  fetch(`${BACKEND_URL}/api/positions?trader_id=${agent.id}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  .then(res => res.ok ? res.json() : [])
  .catch(() => [])
)

const positionsResults = await Promise.all(positionPromises)

// Combine all results
const allPositions = positionsResults.flatMap((positions, index) => {
  const agent = mappedAgents[index]
  return positions.map(pos => ({
    id: `${agent.id}-${pos.symbol}`,
    // ... transform position
    agentId: agent.id,
  }))
})
```

### 2. Caching with SWR

Use `useSWR` for automatic caching and revalidation:

```typescript
import useSWR from 'swr'

const fetcher = (url: string) => 
  fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())

// In component:
const { data: tradersData, error, isLoading } = useSWR(
  `${BACKEND_URL}/api/my-traders`,
  fetcher,
  {
    refreshInterval: 30000,  // Auto-refresh every 30 seconds
    revalidateOnFocus: true, // Refresh when window gains focus
    dedupingInterval: 5000,  // Dedupe requests within 5s
  }
)
```

### 3. Memoization

Memoize expensive calculations:

```typescript
import { useMemo } from 'react'

// Memoize dashboard metrics
const dashboardMetrics = useMemo(() => {
  return calculateDashboardMetrics(agents)
}, [agents])

// Memoize equity curve data
const equityData = useMemo(() => {
  return generateEquityCurve(dashboardMetrics.totalCapital, dashboardMetrics.totalPnl)
}, [dashboardMetrics.totalCapital, dashboardMetrics.totalPnl])
```

### 4. Debouncing Updates

Debounce frequent updates to prevent UI flicker:

```typescript
import { useCallback, useRef } from 'react'

function useDebouncedUpdate(delay = 500) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((callback: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(callback, delay)
  }, [delay])
}

// Usage:
const debouncedUpdate = useDebouncedUpdate(500)

function handleDataUpdate(newData) {
  debouncedUpdate(() => {
    setAgents(newData.agents)
    setPositions(newData.positions)
  })
}
```

---

## API Request/Response Examples (Complete)

### Example 1: Complete Fetch Sequence

```bash
# User loads /trade page
# Browser automatically sends authentication cookies

# Request 1: Get all traders
GET http://localhost:8080/api/my-traders
Cookie: session_token=xxx; Path=/; HttpOnly; Secure
Content-Type: application/json

# Response 1:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "traders": [
    {
      "trader_id": "binance_deepseek_001",
      "trader_name": "Momentum Bot",
      "ai_model": "deepseek-chat",
      "exchange": "binance",
      "total_equity": 11827.45,
      "total_pnl": 1827.45,
      "total_pnl_pct": 18.27,
      "position_count": 3,
      "margin_used_pct": 45.2,
      "is_running": true,
      "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
      "created_at": "2025-11-01T08:00:00Z"
    }
  ],
  "count": 1
}

# Request 2: Get positions for trader 1
GET http://localhost:8080/api/positions?trader_id=binance_deepseek_001
Cookie: session_token=xxx; Path=/; HttpOnly; Secure
Content-Type: application/json

# Response 2:
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "entry_price": 50000.00,
    "mark_price": 51500.00,
    "quantity": 0.1,
    "leverage": 5,
    "unrealized_pnl": 150.00,
    "unrealized_pnl_pct": 3.0,
    "liquidation_price": 45000.00,
    "margin_used": 1000.00,
    "stop_loss": 49000.00,
    "take_profit": 52000.00,
    "created_at": "2025-11-09T10:30:00Z"
  },
  {
    "symbol": "ETHUSDT",
    "side": "BUY",
    "entry_price": 3000.00,
    "mark_price": 3100.00,
    "quantity": 1.0,
    "leverage": 3,
    "unrealized_pnl": 100.00,
    "unrealized_pnl_pct": 3.33,
    "created_at": "2025-11-09T11:00:00Z"
  },
  {
    "symbol": "SOLUSDT",
    "side": "SELL",
    "entry_price": 120.00,
    "mark_price": 115.00,
    "quantity": 10.0,
    "leverage": 2,
    "unrealized_pnl": 50.00,
    "unrealized_pnl_pct": 4.17,
    "created_at": "2025-11-09T12:00:00Z"
  }
]
```

### Example 2: Error Response (Not Authenticated)

```bash
GET http://localhost:8080/api/my-traders
# No cookies or invalid session

HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized: Please log in"
}
```

### Example 3: No Traders Found

```bash
GET http://localhost:8080/api/my-traders
Cookie: session_token=valid_token

HTTP/1.1 200 OK
Content-Type: application/json

{
  "traders": [],
  "count": 0
}
```

---

## Summary: Data Mapping Table

| UI Component | Data Needed | Go API Endpoint | Field Mapping |
|--------------|-------------|-----------------|---------------|
| **Equity Dashboard** | Total capital, P&L, equity | `GET /api/my-traders` | Calculate from `total_equity` and `total_pnl` |
| **Agent Card - Name** | Trader name | `GET /api/my-traders` | `trader_name` |
| **Agent Card - Status** | Running status | `GET /api/my-traders` | `is_running` → 'active'/'paused' |
| **Agent Card - Deposit** | Initial investment | `GET /api/my-traders` | `total_equity - total_pnl` |
| **Agent Card - Assets** | Trading symbols | `GET /api/my-traders` | `symbols` array |
| **Agent Card - P&L** | Profit/loss | `GET /api/my-traders` | `total_pnl` (formatted) |
| **Agent Card - ROI** | Return % | `GET /api/my-traders` | `total_pnl_pct` |
| **Position Card - Symbol** | Trading pair | `GET /api/positions` | `symbol` |
| **Position Card - Type** | Long/short | `GET /api/positions` | `side` → 'long'/'short' |
| **Position Card - Prices** | Entry/current | `GET /api/positions` | `entry_price`, `mark_price` |
| **Position Card - P&L** | Unrealized P&L | `GET /api/positions` | `unrealized_pnl`, `unrealized_pnl_pct` |
| **Position Card - Risk** | Stop/take profit | `GET /api/positions` | `stop_loss`, `take_profit` |

---

## Conclusion

This guide provides a complete reference for integrating the Trade Page with the Go backend API:

1. **Two main API calls**: `/api/my-traders` and `/api/positions?trader_id=xxx`
2. **Simple transformations**: Field mapping and calculations
3. **Cookie-based auth**: No manual token management needed
4. **Error handling**: Comprehensive error and edge case handling
5. **Performance**: Parallel fetching and memoization strategies

All data is fetched from the Go backend with no mock data, providing real-time trading information to users.

