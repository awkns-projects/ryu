import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface BackendPosition {
  trader_id: string
  trader_name: string
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
}

interface ActivePosition {
  id: string
  agentId: string
  agentName: string
  asset: string
  type: 'Long' | 'Short'
  size: number
  leverage: string
  entryPrice: number
  currentPrice: number
  pnl: number
  roi: number
}

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from new backend endpoint
    const response = await fetch(`${BACKEND_URL}/api/positions/all`, {
      cache: 'no-store',
      next: { revalidate: 10 }
    })

    if (!response.ok) {
      // Backend endpoint doesn't exist yet - return empty with message
      console.warn('Positions endpoint /api/positions/all not available yet')
      return NextResponse.json({
        positions: [],
        totalCount: 0,
        totalValue: 0,
        avgLeverage: 0,
        avgRoi: 0,
        lastUpdated: new Date().toISOString(),
        message: 'Positions data will be available soon. Backend endpoint pending implementation.'
      })
    }

    const data = await response.json()

    // Transform to ActivePosition format
    const positions: ActivePosition[] = data.positions.map((pos: BackendPosition) => ({
      id: `${pos.trader_id}-${pos.symbol}`,
      agentId: pos.trader_id,
      agentName: pos.trader_name,
      asset: extractAssetName(pos.symbol),
      type: pos.side === 'BUY' ? 'Long' : 'Short',
      size: pos.quantity,
      leverage: `${pos.leverage}x`,
      entryPrice: pos.entry_price,
      currentPrice: pos.mark_price,
      pnl: pos.unrealized_pnl,
      roi: pos.unrealized_pnl_pct
    }))

    // Calculate aggregated stats
    const totalValue = positions.reduce((sum, p) => sum + (p.size * p.currentPrice), 0)
    const avgLeverage = positions.length > 0
      ? positions.reduce((sum, p) => sum + parseInt(p.leverage), 0) / positions.length
      : 0
    const avgRoi = positions.length > 0
      ? positions.reduce((sum, p) => sum + p.roi, 0) / positions.length
      : 0

    return NextResponse.json({
      positions,
      totalCount: positions.length,
      totalValue,
      avgLeverage,
      avgRoi,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Positions API error:', error)

    // Return empty data with error message
    return NextResponse.json({
      positions: [],
      totalCount: 0,
      totalValue: 0,
      avgLeverage: 0,
      avgRoi: 0,
      lastUpdated: new Date().toISOString(),
      message: 'Backend endpoint not available. Waiting for backend implementation.'
    })
  }
}

function extractAssetName(symbol: string): string {
  // Remove common suffixes
  let asset = symbol.replace(/USDT$/, '')
  asset = asset.replace(/PERP$/, '')
  asset = asset.replace(/USD$/, '')
  asset = asset.replace(/-.*$/, '') // Remove anything after dash

  return asset
}

