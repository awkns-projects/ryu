'use client'

import { useState, useEffect } from 'react'
import { useGoAuth } from '@/contexts/go-auth-context'
import { Card } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown, Activity, Target, AlertCircle } from 'lucide-react'

interface Statistics {
  total_cycles: number
  successful_cycles: number
  failed_cycles: number
  total_open_positions: number
  total_close_positions: number
}

interface StatisticsTabProps {
  traderId: string
}

export function StatisticsTab({ traderId }: StatisticsTabProps) {
  const { token } = useGoAuth()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!traderId || !token) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/go/trade/statistics/${traderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch statistics')
        }

        const data = await response.json()
        setStatistics(data)
      } catch (err: any) {
        console.error('Failed to fetch statistics:', err)
        setError(err.message || 'Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatistics, 30000)
    return () => clearInterval(interval)
  }, [traderId, token])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading statistics...</span>
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

  if (!statistics) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No statistics available yet.</p>
        </div>
      </Card>
    )
  }

  const successRate = statistics.total_cycles > 0
    ? (statistics.successful_cycles / statistics.total_cycles) * 100
    : 0

  const totalPositions = statistics.total_open_positions + statistics.total_close_positions

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Trading Statistics</h3>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Cycles */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Cycles</div>
              <div className="text-3xl font-bold">{statistics.total_cycles}</div>
              <div className="text-xs text-gray-500 mt-2">
                Decision cycles executed
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Success Rate</div>
              <div className="text-3xl font-bold">{successRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-2">
                {statistics.successful_cycles} / {statistics.total_cycles} successful
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </Card>

        {/* Total Positions */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Positions</div>
              <div className="text-3xl font-bold">{totalPositions}</div>
              <div className="text-xs text-gray-500 mt-2">
                Opened + Closed
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cycle Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Cycle Breakdown</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Successful Cycles</span>
              </div>
              <span className="font-semibold">{statistics.successful_cycles}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Failed Cycles</span>
              </div>
              <span className="font-semibold">{statistics.failed_cycles}</span>
            </div>
          </div>
        </Card>

        {/* Position Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Position Breakdown</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Opened Positions</span>
              </div>
              <span className="font-semibold">{statistics.total_open_positions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Closed Positions</span>
              </div>
              <span className="font-semibold">{statistics.total_close_positions}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Note */}
      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2">
          <Activity className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium mb-1">About Statistics</p>
            <p className="text-gray-400">
              Statistics are updated in real-time as your AI agent makes trading decisions.
              A higher success rate indicates the AI is executing decisions without errors.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

