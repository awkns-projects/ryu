'use client'

import { useState, useEffect } from 'react'
import { useGoAuth } from '@/contexts/go-auth-context'
import { Card } from '@/components/ui/card'
import { Brain, TrendingUp, TrendingDown, Activity, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DecisionAction {
  action: string
  symbol: string
  quantity: number
  leverage: number
  price: number
  order_id: number
  timestamp: string
  success: boolean
  error: string
}

interface DecisionRecord {
  timestamp: string
  cycle_number: number
  input_prompt: string
  cot_trace: string
  decision_json: string
  account_state: {
    total_balance: number
    available_balance: number
    total_unrealized_profit: number
    position_count: number
    margin_used_pct: number
  }
  positions: Array<{
    symbol: string
    side: string
    position_amt: number
    entry_price: number
    mark_price: number
    unrealized_profit: number
    leverage: number
    liquidation_price: number
  }>
  candidate_coins: string[]
  decisions: DecisionAction[]
  execution_log: string[]
  success: boolean
  error_message: string
}

interface DecisionLogsTabProps {
  traderId: string
}

export function DecisionLogsTab({ traderId }: DecisionLogsTabProps) {
  const { token } = useGoAuth()
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLatestOnly, setShowLatestOnly] = useState(true)

  useEffect(() => {
    const fetchDecisions = async () => {
      if (!traderId || !token) return

      try {
        setLoading(true)
        setError(null)

        const endpoint = showLatestOnly
          ? `/api/go/trade/decisions/latest/${traderId}`
          : `/api/go/trade/decisions/${traderId}`

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch decision logs')
        }

        const data = await response.json()
        setDecisions(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error('Failed to fetch decisions:', err)
        setError(err.message || 'Failed to load decision logs')
      } finally {
        setLoading(false)
      }
    }

    fetchDecisions()

    // Refresh every 30 seconds
    const interval = setInterval(fetchDecisions, 30000)
    return () => clearInterval(interval)
  }, [traderId, token, showLatestOnly])

  if (loading && decisions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading decisions...</span>
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

  if (decisions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No decisions yet. The AI will make decisions once trading starts.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Decision Logs
        </h3>
        <button
          onClick={() => setShowLatestOnly(!showLatestOnly)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
        >
          {showLatestOnly ? 'Show All' : 'Latest Only'}
        </button>
      </div>

      {/* Decision cards */}
      <div className="space-y-4">
        {decisions.map((decision, idx) => (
          <Card key={`${decision.cycle_number}-${idx}`} className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Cycle #{decision.cycle_number}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(decision.timestamp).toLocaleString()}
                </span>
              </div>
              {decision.success ? (
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                  Success
                </span>
              ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                  Failed
                </span>
              )}
            </div>

            {/* Account State */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 rounded-lg bg-gray-800/50">
              <div>
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-sm font-medium">
                  ${decision.account_state.total_balance.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Available</div>
                <div className="text-sm font-medium">
                  ${decision.account_state.available_balance.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Positions</div>
                <div className="text-sm font-medium">
                  {decision.account_state.position_count}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Margin Used</div>
                <div className="text-sm font-medium">
                  {decision.account_state.margin_used_pct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Decisions */}
            {decision.decisions && decision.decisions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Actions Taken:</h4>
                <div className="space-y-2">
                  {decision.decisions.map((action, actionIdx) => (
                    <div
                      key={actionIdx}
                      className={cn(
                        'p-3 rounded-lg flex items-center justify-between',
                        action.action === 'OPEN'
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : action.action === 'CLOSE'
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : 'bg-gray-800/50 border border-gray-700'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {action.action === 'OPEN' ? (
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                        ) : action.action === 'CLOSE' ? (
                          <TrendingDown className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {action.action} {action.symbol}
                          </div>
                          <div className="text-xs text-gray-400">
                            Qty: {action.quantity} | Leverage: {action.leverage}x | Price: $
                            {action.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {action.success ? (
                        <span className="text-xs text-green-400">✓</span>
                      ) : (
                        <span className="text-xs text-red-400">✗</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reasoning (COT Trace) */}
            {decision.cot_trace && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  View AI Reasoning
                </summary>
                <div className="mt-2 p-4 rounded-lg bg-gray-800/50 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                  {decision.cot_trace}
                </div>
              </details>
            )}

            {/* Error message if failed */}
            {!decision.success && decision.error_message && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="text-sm text-red-400">{decision.error_message}</div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

