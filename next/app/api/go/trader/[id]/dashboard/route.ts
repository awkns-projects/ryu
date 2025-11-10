import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: traderId } = await params
    const db = getDatabase()

    console.log(`[Dashboard] Fetching data for trader: ${traderId}`)

    // Step 1: Get trader config from SQLite (with joins for enriched data)
    const trader = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.user_id,
        t.ai_model_id,
        t.exchange_id,
        t.initial_balance,
        t.is_running,
        t.btc_eth_leverage,
        t.altcoin_leverage,
        t.scan_interval_minutes,
        t.trading_symbols,
        t.use_coin_pool,
        t.use_oi_top,
        t.created_at,
        t.updated_at,
        a.name as ai_model_name,
        a.provider as ai_provider,
        a.custom_api_url as ai_custom_api_url,
        a.custom_model_name as ai_custom_model_name,
        e.name as exchange_name,
        e.type as exchange_type,
        e.testnet as exchange_testnet
      FROM traders t
      LEFT JOIN ai_models a ON t.ai_model_id = a.id
      LEFT JOIN exchanges e ON t.exchange_id = e.id
      WHERE t.id = ?
    `).get(traderId) as any

    if (!trader) {
      console.warn(`[Dashboard] Trader not found: ${traderId}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Trader not found'
        },
        { status: 404 }
      )
    }

    // Step 2: Fetch live data from Go API in parallel
    const fetchWithTimeout = async (url: string, timeoutMs = 5000) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          next: { revalidate: 15 },
          headers: { 'Accept': 'application/json' }
        })

        clearTimeout(timeout)

        if (!res.ok) {
          console.warn(`[Dashboard] Failed to fetch ${url}: ${res.status}`)
          return null
        }

        return await res.json()
      } catch (error: any) {
        console.warn(`[Dashboard] Error fetching ${url}:`, error.message)
        return null
      } finally {
        clearTimeout(timeout)
      }
    }

    const [account, positions, equityHistory, performance, statistics] = await Promise.allSettled([
      fetchWithTimeout(`${BACKEND_URL}/api/account?trader_id=${traderId}`),
      fetchWithTimeout(`${BACKEND_URL}/api/positions?trader_id=${traderId}`),
      fetchWithTimeout(`${BACKEND_URL}/api/equity-history?trader_id=${traderId}`),
      fetchWithTimeout(`${BACKEND_URL}/api/performance?trader_id=${traderId}`),
      fetchWithTimeout(`${BACKEND_URL}/api/statistics?trader_id=${traderId}`)
    ])

    // Step 3: Process results
    const accountData = account.status === 'fulfilled' ? account.value : null
    const positionsData = positions.status === 'fulfilled' ? positions.value : []
    const equityData = equityHistory.status === 'fulfilled' ? equityHistory.value : []
    const performanceData = performance.status === 'fulfilled' ? performance.value : null
    const statisticsData = statistics.status === 'fulfilled' ? statistics.value : null

    // Calculate derived metrics
    const currentEquity = accountData?.total_wallet_balance || trader.initial_balance || 0
    const initialBalance = trader.initial_balance || 0
    const totalPnL = currentEquity - initialBalance
    const totalPnLPercent = initialBalance > 0
      ? (totalPnL / initialBalance) * 100
      : 0

    const openPositionsCount = Array.isArray(positionsData) ? positionsData.length : 0
    const totalPositionValue = Array.isArray(positionsData)
      ? positionsData.reduce((sum, p) => sum + Math.abs((p.position_amt || 0) * (p.mark_price || 0)), 0)
      : 0

    console.log(`[Dashboard] Successfully fetched data for trader ${traderId}`)

    return NextResponse.json({
      success: true,

      // Configuration (from SQLite)
      config: {
        id: trader.id,
        name: trader.name,
        user_id: trader.user_id,
        is_running: trader.is_running === 1,
        created_at: trader.created_at,
        updated_at: trader.updated_at,

        ai_model: {
          id: trader.ai_model_id,
          name: trader.ai_model_name,
          provider: trader.ai_provider,
          custom_api_url: trader.ai_custom_api_url || null,
          custom_model_name: trader.ai_custom_model_name || null
        },

        exchange: {
          id: trader.exchange_id,
          name: trader.exchange_name,
          type: trader.exchange_type,
          testnet: trader.exchange_testnet === 1
        },

        trading: {
          scan_interval_minutes: trader.scan_interval_minutes,
          trading_symbols: trader.trading_symbols || '',
          use_coin_pool: trader.use_coin_pool === 1,
          use_oi_top: trader.use_oi_top === 1
        },

        leverage: {
          btc_eth: trader.btc_eth_leverage,
          altcoin: trader.altcoin_leverage
        },

        initial_balance: initialBalance
      },

      // Live data (from Go API)
      live: {
        account: accountData,
        positions: positionsData,
        equity_history: equityData,
        performance: performanceData,
        statistics: statisticsData
      },

      // Calculated metrics
      metrics: {
        current_equity: Math.round(currentEquity * 100) / 100,
        initial_balance: Math.round(initialBalance * 100) / 100,
        total_pnl: Math.round(totalPnL * 100) / 100,
        total_pnl_percent: Math.round(totalPnLPercent * 100) / 100,
        open_positions_count: openPositionsCount,
        total_position_value: Math.round(totalPositionValue * 100) / 100,

        // From performance data
        win_rate: performanceData?.win_rate || null,
        total_trades: performanceData?.total_trades || null,
        sharpe_ratio: performanceData?.sharpe_ratio || null,
        max_drawdown: performanceData?.max_drawdown || null
      },

      // Metadata
      metadata: {
        last_updated: new Date().toISOString(),
        sources: {
          config: 'sqlite',
          live_data: 'go_api'
        },
        data_availability: {
          account: accountData !== null,
          positions: Array.isArray(positionsData) && positionsData.length > 0,
          equity_history: Array.isArray(equityData) && equityData.length > 0,
          performance: performanceData !== null,
          statistics: statisticsData !== null
        }
      }
    })

  } catch (error: any) {
    console.error('[Dashboard] Error fetching dashboard data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Cache for 15 seconds
export const revalidate = 15

