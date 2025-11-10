import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface BackendTrader {
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
}

interface LeaderboardAgent {
  id: string
  name: string
  owner: string
  model: string
  exchange: string
  totalEquity: number         // Added: from total_equity
  pnl: number                 // Absolute P&L value
  pnlPct: number             // P&L percentage
  roi: number
  openPositions: number       // Renamed from trades
  marginUsedPct: number       // Added: from margin_used_pct
  winRate: number            // Estimated
  volume: number             // Estimated
  icon: string
  isRunning: boolean         // Added: from is_running
  equityHistory?: any[]
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/competition`, {
      cache: 'no-store',
      next: { revalidate: 30 }
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()

    // Fetch equity history for all traders (for time-series charts)
    const traderIds = data.traders.map((t: BackendTrader) => t.trader_id)
    let equityHistories: Record<string, any[]> = {}

    try {
      const historyRes = await fetch(`${BACKEND_URL}/api/equity-history-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trader_ids: traderIds }),
        cache: 'no-store'
      })

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        equityHistories = historyData.histories || {}
      }
    } catch (error) {
      console.warn('[Leaderboard] Failed to fetch equity histories:', error)
    }

    // Transform to LeaderboardAgent format
    const agents: LeaderboardAgent[] = data.traders.map((trader: BackendTrader) => ({
      id: trader.trader_id,
      name: trader.trader_name,
      owner: parseOwnerFromName(trader.trader_name),
      model: trader.ai_model,
      exchange: trader.exchange,
      totalEquity: trader.total_equity,
      pnl: trader.total_pnl,
      pnlPct: trader.total_pnl_pct,
      roi: trader.total_pnl_pct, // Same as pnlPct for compatibility
      openPositions: trader.position_count,
      marginUsedPct: trader.margin_used_pct,
      winRate: estimateWinRate(trader.total_pnl_pct, trader.position_count), // Estimated
      volume: estimateVolume(trader.total_equity, trader.position_count), // Estimated
      icon: getModelIcon(trader.ai_model),
      isRunning: trader.is_running,
      equityHistory: equityHistories[trader.trader_id] || []
    }))

    // Sort by PnL descending
    agents.sort((a, b) => b.pnl - a.pnl)

    return NextResponse.json({
      agents,
      totalCount: agents.length,
      lastUpdated: new Date().toISOString(),
      _meta: {
        winRateSource: 'estimated',
        volumeSource: 'estimated',
        tradesSource: 'open_positions',
        historySource: Object.keys(equityHistories).length > 0 ? 'api' : 'unavailable'
      }
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data',
        agents: [],
        totalCount: 0,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// ⚠️ Helper functions - ESTIMATED DATA (NOT REAL)
// These functions generate estimated metrics until backend provides real data
// See /docs/EXPLORER_API_GAPS.md for full details

/**
 * Estimate win rate from P&L percentage
 * ⚠️ THIS IS NOT ACCURATE - arbitrary formula
 * 
 * Real win rate needs: (winning_trades / total_trades * 100)
 * Currently using: 50% base + (pnl_pct / 2)
 * 
 * Problems:
 * - A trader with +10% PnL could have 90% win rate (many small wins)
 *   or 10% win rate (one big win)
 * - No correlation between P&L% and win rate
 * 
 * To fix: Add statistics to /api/competition response (requires backend change)
 */
function estimateWinRate(pnlPct: number, positionCount: number): number {
  if (positionCount === 0) return 0
  const estimated = 50 + (pnlPct / 2)
  return Math.min(Math.max(estimated, 0), 100)
}

/**
 * Estimate trading volume
 * ⚠️ THIS IS COMPLETELY FAKE - nonsensical formula
 * 
 * Real volume needs: Sum of (entry_price * quantity) for all trades
 * Currently using: equity * positions * 10 (no relation to reality)
 * 
 * Recommendation: Remove this metric or track real volume in backend
 */
function estimateVolume(equity: number, positionCount: number): number {
  return equity * positionCount * 10
}

function parseOwnerFromName(name: string): string {
  // Try to extract owner from name format "Owner's Trader Name"
  const match = name.match(/^([^']+)'s/)
  if (match) return match[1]

  // Try to extract from format "Owner - Trader Name"
  const dashMatch = name.match(/^([^-]+)\s*-/)
  if (dashMatch) return dashMatch[1].trim()

  return 'Anonymous'
}

function getModelIcon(model: string): string {
  const modelLower = model.toLowerCase()

  const icons: Record<string, string> = {
    deepseek: '🤖',
    claude: '🧠',
    gpt: '🎯',
    'gpt-4': '🎯',
    'gpt-3.5': '💡',
    gemini: '✨',
    openai: '🎯',
    anthropic: '🧠',
    default: '🤖'
  }

  // Find matching icon
  for (const [key, icon] of Object.entries(icons)) {
    if (modelLower.includes(key)) {
      return icon
    }
  }

  return icons.default
}

