import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), '..', 'config.db')

interface EnhancedAgent {
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
  winRate: number
  walletAddress: string
}

export async function GET(request: NextRequest) {
  let db: Database.Database | null = null

  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided', agents: [], totalCount: 0 },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Extract user_id from JWT (simplified - you might need to decode properly)
    // For now, we'll get it from the Go backend

    console.log('🔄 [Enhanced API] Fetching traders with enriched data...')

    // ===========================
    // STEP 1: Get traders from Go backend
    // ===========================
    const tradersResponse = await fetch(`${BACKEND_URL}/api/my-traders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    if (!tradersResponse.ok) {
      throw new Error(`Backend error: ${tradersResponse.status}`)
    }

    const tradersData = await tradersResponse.json()
    const tradersArray = Array.isArray(tradersData) ? tradersData : (tradersData.traders || [])

    if (tradersArray.length === 0) {
      return NextResponse.json({
        agents: [],
        totalCount: 0,
        activeCount: 0,
        lastUpdated: new Date().toISOString(),
      })
    }

    console.log('✅ [Enhanced API] Traders fetched:', tradersArray.length)

    // ===========================
    // STEP 2: Open SQLite database directly
    // ===========================
    db = new Database(DB_PATH, { readonly: true })
    console.log('✅ [Enhanced API] SQLite database opened')

    // Get user_id from first trader (all traders belong to same user)
    const firstTraderId = tradersArray[0].trader_id
    const userIdQuery = db.prepare('SELECT user_id FROM traders WHERE id = ?')
    const userIdRow = userIdQuery.get(firstTraderId) as { user_id: string } | undefined
    const userId = userIdRow?.user_id || 'default'

    console.log('📊 [Enhanced API] User ID:', userId)

    // ===========================
    // STEP 3: Fetch enriched data for each trader
    // ===========================
    const agentsPromises = tradersArray.map(async (trader: any) => {
      const traderId = trader.trader_id
      const deposit = trader.initial_balance || 0

      // Query SQLite for trader config + exchange info (with wallet)
      const query = `
        SELECT 
          t.id as trader_id,
          t.name as trader_name,
          t.trading_symbols,
          t.exchange_id,
          e.hyperliquid_wallet_addr,
          e.name as exchange_name
        FROM traders t
        LEFT JOIN exchanges e ON t.exchange_id = e.id
        WHERE t.id = ? AND t.user_id = ?
      `

      const row = db!.prepare(query).get(traderId, userId) as {
        trader_id: string
        trader_name: string
        trading_symbols: string
        exchange_id: string
        hyperliquid_wallet_addr: string
        exchange_name: string
      } | undefined

      // Parse trading symbols
      let assets: string[] = []
      if (row?.trading_symbols) {
        assets = row.trading_symbols
          .split(',')
          .map((s: string) => s.trim().replace('USDT', '').replace('USDC', ''))
          .filter((s: string) => s.length > 0)
      }

      // Get wallet address
      const walletAddress = row?.hyperliquid_wallet_addr || ''

      // Fetch PnL from Go backend
      let pnlString = '+$0.00'
      let pnlPercent = 0
      let totalActions = 0

      try {
        const accountResponse = await fetch(`${BACKEND_URL}/api/account?trader_id=${traderId}`, {
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
        console.warn(`⚠️ [Enhanced API] Failed to fetch account for ${traderId}`)
      }

      // Fetch win rate from Go backend performance endpoint
      let winRate = 0
      try {
        const performanceResponse = await fetch(`${BACKEND_URL}/api/performance?trader_id=${traderId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        })

        if (performanceResponse.ok) {
          const performance = await performanceResponse.json()
          winRate = performance.win_rate || 0
          console.log(`✅ [Enhanced API] Win rate for ${trader.trader_name}: ${winRate.toFixed(2)}%`)
        }
      } catch (err) {
        console.warn(`⚠️ [Enhanced API] Failed to fetch performance for ${traderId}`)
      }

      return {
        id: traderId,
        name: trader.trader_name || 'Unnamed Trader',
        description: `${trader.ai_model || 'AI'} trading on ${row?.exchange_name || 'exchange'}`,
        icon: '🤖',
        status: trader.is_running === true ? 'active' : 'paused',
        totalActions,
        createdAt: new Date().toISOString(),
        deposit,
        assets,
        pnl: pnlString,
        pnlPercent,
        winRate,
        walletAddress,
      } as EnhancedAgent
    })

    const agents = await Promise.all(agentsPromises)

    // Calculate metrics
    const totalCapital = agents.reduce((sum, agent) => sum + agent.deposit, 0)
    const totalPnl = agents.reduce((sum, agent) => {
      const pnlValue = parseFloat(agent.pnl.replace(/[^0-9.-]/g, ''))
      return sum + pnlValue
    }, 0)
    const currentEquity = totalCapital + totalPnl
    const pnlPercent = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0
    const activeCount = agents.filter(a => a.status === 'active').length

    console.log('✅ [Enhanced API] Enriched agents:', {
      total: agents.length,
      withWallet: agents.filter(a => a.walletAddress).length,
      withWinRate: agents.filter(a => a.winRate > 0).length,
    })

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
    console.error('❌ [Enhanced API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch traders',
        agents: [],
        totalCount: 0,
        activeCount: 0,
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    )
  } finally {
    // Close database connection
    if (db) {
      db.close()
      console.log('✅ [Enhanced API] SQLite database closed')
    }
  }
}

