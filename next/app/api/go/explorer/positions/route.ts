import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  const db = getDatabase()
  console.log('[Positions] Fetching positions for running traders')

  try {
    // 1. Get all running traders from SQLite
    const traders = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.user_id,
        t.exchange_id,
        e.name as exchange_name,
        e.type as exchange_type
      FROM traders t
      LEFT JOIN exchanges e ON t.exchange_id = e.id
      WHERE t.is_running = 1
      LIMIT 50
    `).all() as any[]

    if (traders.length === 0) {
      console.log('[Positions] No running traders found')
      return NextResponse.json({
        positions: [],
        totalCount: 0,
        totalValue: 0,
        avgLeverage: 0,
        avgRoi: 0,
        lastUpdated: new Date().toISOString(),
        message: 'No running traders'
      }, { status: 200 })
    }

    console.log(`[Positions] Found ${traders.length} running traders`)

    // 2. Fetch positions for each trader from Go API
    const positionsPromises = traders.map(async (trader) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/positions?trader_id=${trader.id}`, {
          cache: 'no-store'
        })

        if (!res.ok) {
          console.warn(`[Positions] Failed to fetch for trader ${trader.id}: ${res.status}`)
          return []
        }

        const positions = await res.json()

        // Transform to frontend format
        return positions.map((p: any) => {
          const roiPct = p.entry_price && p.entry_price > 0 ?
            ((p.mark_price - p.entry_price) / p.entry_price * 100) *
            (p.side === 'BUY' || p.side === 'LONG' ? 1 : -1) : 0

          return {
            id: `${trader.id}-${p.symbol}`,
            agentId: trader.id,
            agentName: trader.name,
            asset: p.symbol?.replace(/USDT$|PERP$|USD$/i, ''),
            type: (p.side === 'BUY' || p.side === 'LONG') ? 'Long' : 'Short',
            size: Math.abs(p.position_amt || p.quantity || 0),
            leverage: `${p.leverage || 1}x`,
            entryPrice: p.entry_price || 0,
            currentPrice: p.mark_price || 0,
            pnl: p.unrealized_pnl || 0,
            roi: roiPct,
            exchange: trader.exchange_name || trader.exchange_id
          }
        })
      } catch (error) {
        console.error(`[Positions] Error fetching for trader ${trader.id}:`, error)
        return []
      }
    })

    const allPositions = (await Promise.all(positionsPromises)).flat()

    // 3. Calculate aggregated stats
    const totalValue = allPositions.reduce((sum, p) => sum + (p.size * p.currentPrice), 0)
    const totalPnL = allPositions.reduce((sum, p) => sum + p.pnl, 0)
    const avgLeverage = allPositions.length > 0
      ? allPositions.reduce((sum, p) => sum + parseInt(p.leverage), 0) / allPositions.length
      : 0
    const avgRoi = allPositions.length > 0
      ? allPositions.reduce((sum, p) => sum + p.roi, 0) / allPositions.length
      : 0

    console.log(`[Positions] Successfully aggregated ${allPositions.length} positions`)

    return NextResponse.json({
      positions: allPositions,
      totalCount: allPositions.length,
      totalValue,
      totalPnL,
      avgLeverage,
      avgRoi,
      lastUpdated: new Date().toISOString()
    }, { status: 200 })

  } catch (error: any) {
    console.error('[Positions] Error in aggregation:', error)
    return NextResponse.json(
      {
        positions: [],
        totalCount: 0,
        totalValue: 0,
        avgLeverage: 0,
        avgRoi: 0,
        lastUpdated: new Date().toISOString(),
        message: 'Failed to fetch positions: ' + error.message
      },
      { status: 500 }
    )
  }
}
