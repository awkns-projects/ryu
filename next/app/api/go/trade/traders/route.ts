import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Interface matching the ACTUAL response from Go backend /api/my-traders
interface BackendTrader {
  trader_id: string
  trader_name: string
  ai_model: string
  exchange_id: string  // Note: it's exchange_id, not exchange
  is_running: boolean
  initial_balance: number
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

    // Handle both array response and object with traders property
    const tradersArray = Array.isArray(data) ? data : (data.traders || [])
    console.log('✅ [API Route] Traders fetched:', tradersArray.length)

    // Log first trader's raw data to see what fields are available
    if (tradersArray.length > 0) {
      console.log('📊 [API Route] Sample trader raw data:', JSON.stringify(tradersArray[0], null, 2))
    }

    // Fetch detailed config for each trader to get trading symbols and other data
    const agentsPromises = tradersArray.map(async (trader: BackendTrader) => {
      // Use initial_balance as deposit
      const deposit = trader.initial_balance || 0

      // Try to fetch trader config to get trading symbols
      let assets: string[] = []
      try {
        const configResponse = await fetch(`${BACKEND_URL}/api/traders/${trader.trader_id}/config`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        })

        if (configResponse.ok) {
          const config = await configResponse.json()
          // Parse trading symbols (e.g., "BTCUSDT,ETHUSDT" -> ["BTC", "ETH"])
          if (config.trading_symbols) {
            assets = config.trading_symbols
              .split(',')
              .map((s: string) => s.trim().replace('USDT', ''))
              .filter((s: string) => s.length > 0)
          }
        }
      } catch (err) {
        console.warn(`⚠️ [API Route] Failed to fetch config for trader ${trader.trader_id}`)
      }

      // Try to fetch account info to get real-time PnL
      let pnlString = '+$0.00'
      let pnlPercent = 0
      let totalActions = 0

      try {
        const accountResponse = await fetch(`${BACKEND_URL}/api/account?trader_id=${trader.trader_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        })

        if (accountResponse.ok) {
          const account = await accountResponse.json()
          const pnlValue = account.total_pnl || 0
          pnlString = pnlValue >= 0
            ? `+$${pnlValue.toFixed(2)}`
            : `-$${Math.abs(pnlValue).toFixed(2)}`
          pnlPercent = account.total_pnl_pct || 0
          totalActions = account.position_count || 0
        }
      } catch (err) {
        console.warn(`⚠️ [API Route] Failed to fetch account for trader ${trader.trader_id}`)
      }

      return {
        id: trader.trader_id || `trader-${Date.now()}-${Math.random()}`,
        name: trader.trader_name || 'Unnamed Trader',
        description: `${trader.ai_model || 'AI'} trading on ${trader.exchange_id || 'exchange'}`,
        icon: '🤖',
        status: trader.is_running === true ? 'active' : 'paused',
        totalActions: totalActions,
        createdAt: new Date().toISOString(),
        deposit: deposit,
        assets: assets,
        pnl: pnlString,
        pnlPercent: pnlPercent,
      }
    })

    const agents: Agent[] = await Promise.all(agentsPromises)

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

