'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, PieChart } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Position {
  symbol: string
  side: string
  entry_price: number
  mark_price: number
  quantity: number
  leverage: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  liquidation_price: number
}

interface PositionsTableProps {
  positions: Position[]
  loading?: boolean
}

export function PositionsTable({ positions, loading }: PositionsTableProps) {
  const t = useTranslations('tradePage')

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading positions...</div>
        </div>
      </Card>
    )
  }

  if (!positions || positions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            Current Positions
          </h2>
        </div>
        <div className="text-center py-16 text-gray-400">
          <div className="mb-4 opacity-50 flex justify-center">
            <PieChart className="w-16 h-16" />
          </div>
          <div className="text-lg font-semibold mb-2">No Positions</div>
          <div className="text-sm">No active trading positions</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          Current Positions
        </h2>
        {positions.length > 0 && (
          <div className="text-xs px-3 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            {positions.length} Active
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b border-gray-800">
            <tr>
              <th className="pb-3 font-semibold text-gray-400">Symbol</th>
              <th className="pb-3 font-semibold text-gray-400">Side</th>
              <th className="pb-3 font-semibold text-gray-400">Entry Price</th>
              <th className="pb-3 font-semibold text-gray-400">Mark Price</th>
              <th className="pb-3 font-semibold text-gray-400">Quantity</th>
              <th className="pb-3 font-semibold text-gray-400">Position Value</th>
              <th className="pb-3 font-semibold text-gray-400">Leverage</th>
              <th className="pb-3 font-semibold text-gray-400">Unrealized P&L</th>
              <th className="pb-3 font-semibold text-gray-400">Liq. Price</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => (
              <tr key={i} className="border-b border-gray-800 last:border-0">
                <td className="py-3 font-mono font-semibold text-white">{pos.symbol}</td>
                <td className="py-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={
                      pos.side === 'long' || pos.side === 'LONG'
                        ? {
                            background: 'rgba(14, 203, 129, 0.1)',
                            color: '#0ECB81',
                          }
                        : {
                            background: 'rgba(246, 70, 93, 0.1)',
                            color: '#F6465D',
                          }
                    }
                  >
                    {pos.side === 'long' || pos.side === 'LONG' ? 'LONG' : 'SHORT'}
                  </span>
                </td>
                <td className="py-3 font-mono text-white">{pos.entry_price.toFixed(4)}</td>
                <td className="py-3 font-mono text-white">{pos.mark_price.toFixed(4)}</td>
                <td className="py-3 font-mono text-white">{pos.quantity.toFixed(4)}</td>
                <td className="py-3 font-mono font-bold text-white">
                  {(pos.quantity * pos.mark_price).toFixed(2)} USDT
                </td>
                <td className="py-3 font-mono text-yellow-400">{pos.leverage}x</td>
                <td className="py-3 font-mono">
                  <span
                    style={{
                      color: pos.unrealized_pnl >= 0 ? '#0ECB81' : '#F6465D',
                      fontWeight: 'bold',
                    }}
                  >
                    {pos.unrealized_pnl >= 0 ? '+' : ''}
                    {pos.unrealized_pnl.toFixed(2)} ({pos.unrealized_pnl_pct.toFixed(2)}%)
                  </span>
                </td>
                <td className="py-3 font-mono text-gray-400">
                  {pos.liquidation_price ? pos.liquidation_price.toFixed(4) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

