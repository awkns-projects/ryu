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
  symbols: string[]
  created_at: string
}

interface Agent {
  id: string
  name: string
  description: string
  icon: string
  status: 'active' | 'paused'
  totalActions: number
  createdAt: string
  deposit: number
  assets: string[]
  pnl: string
  pnlPercent: number
}

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header (sent from frontend)
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [API Route] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided', traders: [], count: 0 },
        { status: 401 }
      )
    }

    console.log('🔄 [API Route] Fetching traders from Go backend...')

    const response = await fetch(`${BACKEND_URL}/api/my-traders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward JWT token to Go backend
      },
    })

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('⚠️ [API Route] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized', traders: [], count: 0 },
        { status: 401 }
      )
    }

    if (!response.ok) {
      console.error(`❌ [API Route] Backend error: ${response.status}`)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ [API Route] Traders fetched:', data.traders?.length || 0)

    // Transform to frontend Agent format
    const agents: Agent[] = (data.traders || []).map((trader: BackendTrader) => {
      // Calculate initial deposit (total_equity - total_pnl)
      const deposit = (trader.total_equity || 0) - (trader.total_pnl || 0)

      // Extract trading assets/symbols
      const assets = Array.isArray(trader.symbols) ? trader.symbols : []

      // Format P&L string with sign and currency
      const pnlValue = trader.total_pnl || 0
      const pnlString = pnlValue >= 0
        ? `+$${pnlValue.toFixed(2)}`
        : `-$${Math.abs(pnlValue).toFixed(2)}`

      return {
        id: trader.trader_id || `trader-${Date.now()}-${Math.random()}`,
        name: trader.trader_name || 'Unnamed Trader',
        description: `${trader.ai_model || 'AI'} trading on ${trader.exchange || 'exchange'}`,
        icon: '🤖',
        status: trader.is_running === true ? 'active' : 'paused',
        totalActions: trader.position_count || 0,
        createdAt: trader.created_at || new Date().toISOString(),
        deposit: deposit,
        assets: assets,
        pnl: pnlString,
        pnlPercent: trader.total_pnl_pct || 0,
      }
    })

    // Calculate dashboard metrics
    const totalCapital = agents.reduce((sum, agent) => sum + agent.deposit, 0)
    const totalPnl = agents.reduce((sum, agent) => {
      const pnlValue = parseFloat(agent.pnl.replace(/[^0-9.-]/g, ''))
      return sum + pnlValue
    }, 0)
    const currentEquity = totalCapital + totalPnl
    const pnlPercent = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0
    const activeCount = agents.filter(a => a.status === 'active').length

    return NextResponse.json({
      agents,
      totalCount: agents.length,
      activeCount,
      metrics: {
        totalCapital,
        totalPnl,
        currentEquity,
        pnlPercent,
      },
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error('❌ [API Route] Traders API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch traders',
        agents: [],
        totalCount: 0,
        activeCount: 0,
        metrics: {
          totalCapital: 0,
          totalPnl: 0,
          currentEquity: 0,
          pnlPercent: 0,
        },
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

