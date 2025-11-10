'use client'

import { useState, useEffect } from 'react'
import { useGoAuth } from '@/contexts/go-auth-context'
import { Card } from '@/components/ui/card'
import { Brain, TrendingUp, TrendingDown, Target, AlertCircle, Activity } from 'lucide-react'

interface SymbolPerformance {
  symbol: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pn_l: number
  avg_pn_l: number
}

interface TradeOutcome {
  symbol: string
  side: string
  open_price: number
  close_price: number
  position_value: number
  margin_used: number
  pn_l: number
  pn_l_pct: number
  duration: string
  open_time: string
  close_time: string
  was_stop_loss: boolean
}

interface PerformanceAnalysis {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  avg_win: number
  avg_loss: number
  profit_factor: number
  sharpe_ratio: number
  recent_trades: TradeOutcome[]
  symbol_stats: { [key: string]: SymbolPerformance }
}

interface AILearningTabProps {
  traderId: string
}

export function AILearningTab({ traderId }: AILearningTabProps) {
  const { token } = useGoAuth()
  const [performance, setPerformance] = useState<PerformanceAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!traderId || !token) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/go/trade/performance/${traderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch AI performance')
        }

        const data = await response.json()
        setPerformance(data)
      } catch (err: any) {
        console.error('Failed to fetch AI performance:', err)
        setError(err.message || 'Failed to load AI learning data')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformance()

    // Refresh every 30 seconds
    const interval = setInterval(fetchPerformance, 30000)
    return () => clearInterval(interval)
  }, [traderId, token])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading AI learning data...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center text-red-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </Card>
    )
  }

  if (!performance || performance.total_trades === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No trading data yet. AI learning analytics will appear after completing trades.</p>
        </div>
      </Card>
    )
  }

  // Convert symbol_stats object to array and sort by total P&L
  const symbolStatsList = Object.values(performance.symbol_stats || {})
    .filter((stat) => stat != null)
    .sort((a, b) => b.total_pn_l - a.total_pn_l)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold">AI Learning & Performance</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Win Rate</div>
              <div className="text-2xl font-bold">{performance.win_rate.toFixed(1)}%</div>
            </div>
            <Target className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {performance.winning_trades}/{performance.total_trades} wins
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg Win</div>
              <div className="text-2xl font-bold text-green-400">
                ${performance.avg_win.toFixed(2)}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
              <div className="text-2xl font-bold text-red-400">
                ${Math.abs(performance.avg_loss).toFixed(2)}
              </div>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Profit Factor</div>
              <div className="text-2xl font-bold">{performance.profit_factor.toFixed(2)}</div>
            </div>
            <Activity className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Performance by Symbol */}
      {symbolStatsList.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Performance by Symbol</h4>
          <div className="space-y-3">
            {symbolStatsList.map((stat) => (
              <div
                key={stat.symbol}
                className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{stat.symbol}</div>
                  <div
                    className={`text-lg font-bold ${stat.total_pn_l >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                  >
                    {stat.total_pn_l >= 0 ? '+' : ''}${stat.total_pn_l.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Win Rate</div>
                    <div className="font-medium">{stat.win_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Trades</div>
                    <div className="font-medium">{stat.total_trades}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Avg P&L</div>
                    <div
                      className={`font-medium ${stat.avg_pn_l >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                      ${stat.avg_pn_l.toFixed(2)}
                    </div>
                  </div>
                </div>
                {/* Win rate bar */}
                <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${stat.win_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Trades */}
      {performance.recent_trades && performance.recent_trades.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Recent Trades</h4>
          <div className="space-y-2">
            {performance.recent_trades.slice(0, 10).map((trade, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg flex items-center justify-between ${trade.pn_l >= 0
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {trade.pn_l >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <div className="font-medium text-sm">
                      {trade.symbol} {trade.side.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${trade.open_price.toFixed(2)} → ${trade.close_price.toFixed(2)} •{' '}
                      {trade.duration}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold ${trade.pn_l >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                  >
                    {trade.pn_l >= 0 ? '+' : ''}${trade.pn_l.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {trade.pn_l_pct.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Learning Insights */}
      <Card className="p-6 bg-purple-500/5 border-purple-500/20">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold mb-2 text-purple-200">AI Learning Insights</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Win Rate:</strong> Your AI has a {performance.win_rate.toFixed(1)}% success
                rate with {performance.total_trades} completed trades.
              </p>
              <p>
                <strong>Profit Factor:</strong> {performance.profit_factor.toFixed(2)}x means the AI
                makes ${performance.profit_factor.toFixed(2)} for every $1 lost
                {performance.profit_factor > 1 ? ' (profitable)' : ' (needs improvement)'}.
              </p>
              {performance.sharpe_ratio > 0 && (
                <p>
                  <strong>Sharpe Ratio:</strong> {performance.sharpe_ratio.toFixed(2)} indicates
                  {performance.sharpe_ratio > 1
                    ? ' excellent risk-adjusted returns'
                    : ' moderate risk-adjusted returns'}
                  .
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                The AI continuously learns from each trade outcome to improve decision-making and
                risk management strategies.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

