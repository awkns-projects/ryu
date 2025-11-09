import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface BackendPosition {
  symbol: string
  side: string
  entry_price: number
  mark_price: number
  quantity: number
  leverage: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  liquidation_price?: number
  margin_used?: number
  stop_loss?: number
  take_profit?: number
  created_at: string
}

interface Position {
  id: string
  symbol: string
  type: 'long' | 'short'
  leverage: number
  entryPrice: number
  currentPrice: number
  quantity: number
  stopLoss?: number
  takeProfit?: number
  pnl: number
  pnlPercent: number
  status: 'open' | 'closed' | 'liquidated'
  source: 'agent' | 'market'
  agentId: string
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header (sent from frontend)
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [API Route] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided', positions: [], totalCount: 0 },
        { status: 401 }
      )
    }

    // Get trader IDs from query params (comma-separated)
    const { searchParams } = new URL(request.url)
    const traderIdsParam = searchParams.get('trader_ids')

    if (!traderIdsParam) {
      return NextResponse.json({
        positions: [],
        totalCount: 0,
        message: 'No trader IDs provided',
        lastUpdated: new Date().toISOString(),
      })
    }

    const traderIds = traderIdsParam.split(',').filter(id => id.trim())

    if (traderIds.length === 0) {
      return NextResponse.json({
        positions: [],
        totalCount: 0,
        message: 'No valid trader IDs',
        lastUpdated: new Date().toISOString(),
      })
    }

    console.log(`🔄 [API Route] Fetching positions for ${traderIds.length} traders...`)

    // Fetch positions for all traders in parallel
    const positionPromises = traderIds.map(traderId =>
      fetch(`${BACKEND_URL}/api/positions?trader_id=${traderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader, // Forward JWT token to Go backend
        },
      })
        .then(res => {
          if (res.ok) return res.json()
          console.warn(`⚠️ [API Route] Failed to fetch positions for ${traderId}: HTTP ${res.status}`)
          return []
        })
        .catch(err => {
          console.warn(`⚠️ [API Route] Error fetching positions for ${traderId}:`, err)
          return []
        })
    )

    const positionsResults = await Promise.all(positionPromises)

    // Transform and combine all positions
    const allPositions: Position[] = positionsResults.flatMap((positions, index) => {
      const traderId = traderIds[index]

      if (!Array.isArray(positions) || positions.length === 0) {
        return []
      }

      return positions.map((pos: BackendPosition) => ({
        id: `${traderId}-${pos.symbol || Date.now()}`,
        symbol: pos.symbol || 'UNKNOWN',
        type: (pos.side === 'BUY' ? 'long' : pos.side === 'SELL' ? 'short' : 'long') as 'long' | 'short',
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
        agentId: traderId,
        createdAt: pos.created_at || new Date().toISOString(),
      }))
    })

    console.log(`✅ [API Route] Positions mapped: ${allPositions.length}`)

    // Calculate aggregated stats
    const totalValue = allPositions.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0)
    const totalPnl = allPositions.reduce((sum, p) => sum + p.pnl, 0)
    const avgLeverage = allPositions.length > 0
      ? allPositions.reduce((sum, p) => sum + p.leverage, 0) / allPositions.length
      : 0

    return NextResponse.json({
      positions: allPositions,
      totalCount: allPositions.length,
      stats: {
        totalValue,
        totalPnl,
        avgLeverage,
      },
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error('❌ [API Route] Positions API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        positions: [],
        totalCount: 0,
        stats: {
          totalValue: 0,
          totalPnl: 0,
          avgLeverage: 0,
        },
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

