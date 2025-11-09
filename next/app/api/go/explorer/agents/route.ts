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

interface RunningAgent {
  id: string
  name: string
  description: string
  model: string
  status: 'active' | 'paused'
  deposit: number
  pnl: number
  roi: number
  trades: number
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/competition`, {
      cache: 'no-store',
      next: { revalidate: 15 }
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()

    // Transform to RunningAgent format
    const agents: RunningAgent[] = data.traders.map((trader: BackendTrader) => ({
      id: trader.trader_id,
      name: trader.trader_name,
      description: generateDescription(trader),
      model: trader.ai_model,
      status: trader.is_running ? 'active' : 'paused',
      deposit: trader.total_equity, // Using total_equity as proxy for initial deposit
      pnl: trader.total_pnl,
      roi: trader.total_pnl_pct,
      trades: trader.position_count
    }))

    // Sort by ROI descending
    agents.sort((a, b) => b.roi - a.roi)

    const activeCount = agents.filter(a => a.status === 'active').length
    const pausedCount = agents.filter(a => a.status === 'paused').length

    return NextResponse.json({
      agents,
      totalCount: agents.length,
      activeCount,
      pausedCount,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch agents data',
        agents: [],
        totalCount: 0,
        activeCount: 0,
        pausedCount: 0,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function generateDescription(trader: BackendTrader): string {
  const modelName = formatModelName(trader.ai_model)
  const exchange = formatExchangeName(trader.exchange)
  const strategy = inferStrategy(trader)

  return `${modelName} AI trading on ${exchange}${strategy ? ` with ${strategy} strategy` : ''}`
}

function formatModelName(model: string): string {
  const names: Record<string, string> = {
    deepseek: 'DeepSeek',
    claude: 'Claude',
    'gpt-4': 'GPT-4',
    'gpt-3.5': 'GPT-3.5',
    gemini: 'Gemini',
    openai: 'OpenAI'
  }

  const modelLower = model.toLowerCase()
  for (const [key, name] of Object.entries(names)) {
    if (modelLower.includes(key)) {
      return name
    }
  }

  return model.toUpperCase()
}

function formatExchangeName(exchange: string): string {
  const names: Record<string, string> = {
    binance: 'Binance Futures',
    hyperliquid: 'Hyperliquid',
    aster: 'Aster',
    bybit: 'Bybit'
  }

  return names[exchange.toLowerCase()] || exchange
}

function inferStrategy(trader: BackendTrader): string | null {
  // Infer strategy from trader name or other signals
  const nameLower = trader.trader_name.toLowerCase()

  if (nameLower.includes('momentum')) return 'momentum'
  if (nameLower.includes('scalp')) return 'scalping'
  if (nameLower.includes('swing')) return 'swing'
  if (nameLower.includes('trend')) return 'trend following'
  if (nameLower.includes('mean')) return 'mean reversion'
  if (nameLower.includes('arbitrage')) return 'arbitrage'

  // Default strategy based on position count
  if (trader.position_count > 5) return 'active trading'
  if (trader.position_count > 0) return 'selective trading'

  return null
}

