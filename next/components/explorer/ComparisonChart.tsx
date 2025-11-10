"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, X, Download } from "lucide-react"

interface Trader {
  id: string
  name: string
  totalEquity: number
  pnl: number
  roi: number
  icon: string
}

interface ComparisonChartProps {
  traderIds: string[]
  traders: Trader[]
  onClose: () => void
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
]

export function ComparisonChart({ traderIds, traders, onClose }: ComparisonChartProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [equityData, setEquityData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEquityData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traderIds])

  const fetchEquityData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/go/explorer/equity-history-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ trader_ids: traderIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch equity data')
      }

      const data = await response.json()
      console.log('📊 Equity data received:', data)

      // Handle different response structures
      if (data.histories && Array.isArray(data.histories)) {
        setEquityData(data.histories)
      } else if (Array.isArray(data)) {
        setEquityData(data)
      } else {
        console.warn('Unexpected data structure:', data)
        setEquityData([])
      }
    } catch (error) {
      console.error('Error fetching equity data:', error)
      setError('Failed to load comparison data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8 bg-white/5 border-white/20">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 bg-white/5 border-white/20">
        <div className="text-center text-red-400">{error}</div>
      </Card>
    )
  }

  // Safety check: ensure equityData is an array
  if (!Array.isArray(equityData) || equityData.length === 0) {
    return (
      <Card className="p-8 bg-white/5 border-white/20">
        <div className="text-center text-white/60">No equity data available for comparison</div>
      </Card>
    )
  }

  // Process data for chart display
  const processedData = equityData.map((history, index) => {
    const trader = traders.find(t => t.id === history.trader_id)
    return {
      traderId: history.trader_id,
      trader: trader,
      data: history.data || [],
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
  })

  // Find min/max for chart scaling
  const allValues = processedData.flatMap(d => d.data.map((p: any) => p.equity))
  const minEquity = Math.min(...allValues, 0)
  const maxEquity = Math.max(...allValues, 1000)
  const range = maxEquity - minEquity

  // Generate SVG path for each trader
  const generatePath = (data: any[]) => {
    if (data.length === 0) return ''

    const width = 1000
    const height = 300

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1 || 1)) * width
      const y = height - ((point.equity - minEquity) / range) * height
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  return (
    <Card className="p-6 bg-white/5 border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Performance Comparison</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 bg-black/20 rounded-lg p-4">
        <svg
          viewBox="0 0 1000 300"
          className="w-full h-64"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2="1000" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1="75" x2="1000" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="150" x2="1000" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="225" x2="1000" y2="225" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="300" x2="1000" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Equity curves */}
          {processedData.map((traderData, index) => (
            <path
              key={traderData.traderId}
              d={generatePath(traderData.data)}
              fill="none"
              stroke={traderData.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {processedData.map((traderData, index) => (
          <div key={traderData.traderId} className="flex items-center gap-2">
            <div
              className="w-4 h-1 rounded"
              style={{ backgroundColor: traderData.color }}
            />
            <span className="text-xs text-white">
              {traderData.trader?.icon} {traderData.trader?.name}
            </span>
          </div>
        ))}
      </div>

      {/* Metrics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-4 text-white/60">Trader</th>
              <th className="text-right py-2 px-4 text-white/60">Equity</th>
              <th className="text-right py-2 px-4 text-white/60">ROI</th>
              <th className="text-right py-2 px-4 text-white/60">PnL</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((trader, index) => (
              <tr key={trader.id} className="border-b border-white/5">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-lg">{trader.icon}</span>
                    <span className="text-white font-medium">{trader.name}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-white font-mono">
                  ${trader.totalEquity.toFixed(2)}
                </td>
                <td className="text-right py-3 px-4">
                  <span className={trader.roi >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {trader.roi >= 0 ? '+' : ''}{trader.roi.toFixed(2)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={trader.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

