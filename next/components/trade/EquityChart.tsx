'use client'

import { useState, useEffect } from 'react'
import { useGoAuth } from '@/contexts/go-auth-context'
import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, Activity, AlertCircle } from 'lucide-react'

interface EquityPoint {
  timestamp: string
  total_equity: number
  available_balance: number
  total_pnl: number
  total_pnl_pct: number
  position_count: number
  margin_used_pct: number
  cycle_number: number
}

interface EquityChartProps {
  traderId: string
}

export function EquityChart({ traderId }: EquityChartProps) {
  const { token } = useGoAuth()
  const [data, setData] = useState<EquityPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEquityHistory = async () => {
      if (!traderId || !token) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/go/trade/equity-history/${traderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch equity history')
        }

        const equityData = await response.json()
        setData(Array.isArray(equityData) ? equityData : [])
      } catch (err: any) {
        console.error('Failed to fetch equity history:', err)
        setError(err.message || 'Failed to load equity history')
      } finally {
        setLoading(false)
      }
    }

    fetchEquityHistory()

    // Refresh every 30 seconds
    const interval = setInterval(fetchEquityHistory, 30000)
    return () => clearInterval(interval)
  }, [traderId, token])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading equity history...</span>
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

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No equity history yet. Data will appear once trading starts.</p>
        </div>
      </Card>
    )
  }

  // Calculate statistics from data
  const latestPoint = data[data.length - 1]
  const firstPoint = data[0]
  const totalReturn = latestPoint ? latestPoint.total_pnl_pct : 0
  const maxEquity = Math.max(...data.map(d => d.total_equity))
  const minEquity = Math.min(...data.map(d => d.total_equity))

  // Format data for chart
  const chartData = data.map(point => ({
    ...point,
    time: new Date(point.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    date: new Date(point.timestamp).toLocaleDateString(),
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400 mb-2">
            {data.date} {data.time}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-gray-400">Equity:</span>{' '}
              <span className="font-semibold text-blue-400">
                ${data.total_equity.toFixed(2)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-400">Available:</span>{' '}
              <span className="font-semibold text-green-400">
                ${data.available_balance.toFixed(2)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-400">P&L:</span>{' '}
              <span className={`font-semibold ${data.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${data.total_pnl.toFixed(2)} ({data.total_pnl_pct.toFixed(2)}%)
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-400">Positions:</span>{' '}
              <span className="font-semibold">{data.position_count}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Equity History</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Total Return</div>
            <div className={`text-lg font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-gray-400 mb-1">Current Equity</div>
          <div className="text-lg font-bold">${latestPoint?.total_equity.toFixed(2) || '0.00'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-400 mb-1">Available</div>
          <div className="text-lg font-bold">${latestPoint?.available_balance.toFixed(2) || '0.00'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-400 mb-1">Max Equity</div>
          <div className="text-lg font-bold">${maxEquity.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-400 mb-1">Min Equity</div>
          <div className="text-lg font-bold">${minEquity.toFixed(2)}</div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="total_equity"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Total Equity"
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="available_balance"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Available Balance"
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2">
          <Activity className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium mb-1">About Equity History</p>
            <p className="text-gray-400">
              This chart shows your account equity over time. Total equity includes unrealized profits from open positions,
              while available balance is the amount you can use to open new positions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

