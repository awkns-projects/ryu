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
  pnl: number
  roi: number
  trades: number
  winRate: number
  volume: number
  icon: string
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

    // Transform to LeaderboardAgent format
    const agents: LeaderboardAgent[] = data.traders.map((trader: BackendTrader) => ({
      id: trader.trader_id,
      name: trader.trader_name,
      owner: parseOwnerFromName(trader.trader_name),
      model: trader.ai_model,
      pnl: trader.total_pnl,
      roi: trader.total_pnl_pct,
      trades: trader.position_count, // Using position_count as proxy for trades
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

// Helper functions
function estimateWinRate(pnlPct: number, positionCount: number): number {
  if (positionCount === 0) return 0
  // Estimate: higher P&L % suggests higher win rate
  // Formula: 50% base + (pnl_pct / 2), capped between 0-100
  const estimated = 50 + (pnlPct / 2)
  return Math.min(Math.max(estimated, 0), 100)
}

function estimateVolume(equity: number, positionCount: number): number {
  // Estimate: volume = equity * positions * 10
  // This is a placeholder formula until backend provides real volume
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

