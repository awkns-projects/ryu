'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { useGoAuth } from '@/contexts/go-auth-context'
import { useTranslations, useLocale } from 'next-intl'
import {
  AlertTriangle,
  Bot,
  Brain,
  RefreshCw,
  TrendingUp,
  PieChart,
  Inbox,
  Send,
  Check,
  X,
  XCircle,
} from 'lucide-react'
import { stripLeadingIcons } from '@/lib/text'
import { getModelDisplayName } from '@/lib/explorer-utils'
import { EquityChart } from './EquityChart'
import { AILearningTab } from './AILearningTab'
import { PositionsTable } from './PositionsTable'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface SystemStatus {
  is_running: boolean
  start_time: string
  runtime_minutes: number
  call_count: number
  initial_balance: number
  scan_interval: string
  stop_until: string
  last_reset_time: string
  ai_provider: string
}

interface AccountInfo {
  total_equity: number
  available_balance: number
  total_pnl: number
  total_pnl_pct: number
  total_unrealized_pnl: number
  margin_used: number
  margin_used_pct: number
  position_count: number
  initial_balance: number
  daily_pnl: number
}

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
  margin_used: number
}

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

interface TraderInfo {
  trader_id: string
  trader_name: string
  ai_model: string
  exchange_id: string
  is_running: boolean
  initial_balance: number
  system_prompt_template?: string
}

interface TraderDashboardProps {
  traderId: string
  onTraderSelect?: (traderId: string) => void
  traders?: TraderInfo[]
}

const authenticatedFetcher = (url: string, token: string) =>
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

export function TraderDashboard({ traderId, onTraderSelect, traders: propTraders }: TraderDashboardProps) {
  const { user, token } = useGoAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('tradePage')
  const searchParams = useSearchParams()
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')
  const [decisionLimit, setDecisionLimit] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('decisionLimit')
      return saved ? parseInt(saved, 10) : 5
    }
    return 5
  })

  const handleLimitChange = (newLimit: number) => {
    setDecisionLimit(newLimit)
    if (typeof window !== 'undefined') {
      localStorage.setItem('decisionLimit', newLimit.toString())
    }
  }

  // Fetch traders list if not provided
  const { data: fetchedTraders } = useSWR<TraderInfo[]>(
    user && token && !propTraders ? 'traders' : null,
    () => authenticatedFetcher('/api/go/trade/traders', token!),
    {
      refreshInterval: 10000,
      shouldRetryOnError: false,
    }
  )

  const traders = propTraders || fetchedTraders || []

  // Fetch trader status
  const { data: status } = useSWR<SystemStatus>(
    user && token && traderId ? `status-${traderId}` : null,
    () => authenticatedFetcher(`${BACKEND_URL}/api/status?trader_id=${traderId}`, token!),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  // Fetch account info
  const { data: account } = useSWR<AccountInfo>(
    user && token && traderId ? `account-${traderId}` : null,
    () => authenticatedFetcher(`${BACKEND_URL}/api/account?trader_id=${traderId}`, token!),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  // Fetch positions
  const { data: positions } = useSWR<Position[]>(
    user && token && traderId ? `positions-${traderId}` : null,
    () => authenticatedFetcher(`${BACKEND_URL}/api/positions?trader_id=${traderId}`, token!),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  // Fetch decisions
  const { data: decisions } = useSWR<DecisionRecord[]>(
    user && token && traderId
      ? `decisions/latest-${traderId}-${decisionLimit}`
      : null,
    () => authenticatedFetcher(
      `/api/go/trade/decisions/latest/${traderId}?limit=${decisionLimit}`,
      token!
    ),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 20000,
    }
  )

  useEffect(() => {
    if (account) {
      const now = new Date().toLocaleTimeString()
      setLastUpdate(now)
    }
  }, [account])

  const selectedTrader = traders.find((t) => t.trader_id === traderId)

  if (!selectedTrader) {
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="skeleton h-8 w-48 mb-3"></div>
          <div className="flex gap-4">
            <div className="skeleton h-4 w-32"></div>
            <div className="skeleton h-4 w-24"></div>
            <div className="skeleton h-4 w-28"></div>
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="skeleton h-4 w-24 mb-3"></div>
              <div className="skeleton h-8 w-32"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const highlightColor = '#60a5fa'

  return (
    <div>
      {/* Trader Header */}
      <Card className="mb-6 p-6 animate-scale-in">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
              <Bot className="w-5 h-5 text-black" />
            </span>
            {selectedTrader.trader_name}
          </h2>

          {/* Trader Selector */}
          {traders && traders.length > 0 && onTraderSelect && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Switch Trader:</span>
              <select
                value={traderId}
                onChange={(e) => onTraderSelect(e.target.value)}
                className="rounded px-3 py-2 text-sm font-medium cursor-pointer transition-colors bg-gray-900 border border-gray-700 text-white"
              >
                {traders.map((trader) => (
                  <option key={trader.trader_id} value={trader.trader_id}>
                    {trader.trader_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            AI Model:{' '}
            <span
              className="font-semibold"
              style={{
                color: selectedTrader.ai_model.includes('qwen')
                  ? '#c084fc'
                  : highlightColor,
              }}
            >
              {getModelDisplayName(
                selectedTrader.ai_model.split('_').pop() ||
                  selectedTrader.ai_model
              )}
            </span>
          </span>
          <span>•</span>
          <span>
            Prompt:{' '}
            <span className="font-semibold" style={{ color: highlightColor }}>
              {selectedTrader.system_prompt_template || '-'}
            </span>
          </span>
          {status && (
            <>
              <span>•</span>
              <span>Cycles: {status.call_count}</span>
              <span>•</span>
              <span>Runtime: {status.runtime_minutes} min</span>
            </>
          )}
        </div>
      </Card>

      {/* Debug Info */}
      {account && (
        <div className="mb-4 p-3 rounded text-xs font-mono bg-gray-900 border border-gray-700">
          <div className="text-gray-400">
            <RefreshCw className="inline w-4 h-4 mr-1 align-text-bottom" />
            Last Update: {lastUpdate} | Total Equity:{' '}
            {account?.total_equity?.toFixed(2) || '0.00'} | Available:{' '}
            {account?.available_balance?.toFixed(2) || '0.00'} | P&L:{' '}
            {account?.total_pnl?.toFixed(2) || '0.00'} (
            {account?.total_pnl_pct?.toFixed(2) || '0.00'}%)
          </div>
        </div>
      )}

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Equity"
          value={`${account?.total_equity?.toFixed(2) || '0.00'} USDT`}
          change={account?.total_pnl_pct || 0}
          positive={(account?.total_pnl ?? 0) > 0}
        />
        <StatCard
          title="Available Balance"
          value={`${account?.available_balance?.toFixed(2) || '0.00'} USDT`}
          subtitle={`${account?.available_balance && account?.total_equity ? ((account.available_balance / account.total_equity) * 100).toFixed(1) : '0.0'}% Free`}
        />
        <StatCard
          title="Total P&L"
          value={`${account?.total_pnl !== undefined && account.total_pnl >= 0 ? '+' : ''}${account?.total_pnl?.toFixed(2) || '0.00'} USDT`}
          change={account?.total_pnl_pct || 0}
          positive={(account?.total_pnl ?? 0) >= 0}
        />
        <StatCard
          title="Positions"
          value={`${account?.position_count || 0}`}
          subtitle={`Margin: ${account?.margin_used_pct?.toFixed(1) || '0.0'}%`}
        />
      </div>

      {/* Main Content: Left-Right Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Chart + Positions */}
        <div className="space-y-6">
          {/* Equity Chart */}
          <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <EquityChart traderId={traderId} />
          </div>

          {/* Current Positions */}
          <div className="animate-slide-in" style={{ animationDelay: '0.15s' }}>
            <PositionsTable positions={positions || []} />
          </div>
        </div>

        {/* Right: Recent Decisions */}
        <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <Card className="p-6 h-fit lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Recent Decisions</h2>
                  {decisions && decisions.length > 0 && (
                    <div className="text-xs text-gray-400">
                      Last {decisions.length} trading cycles
                    </div>
                  )}
                </div>
              </div>

              {/* Display count selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Show:</span>
                <select
                  value={decisionLimit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                  className="rounded px-2 py-1 text-xs font-medium cursor-pointer transition-colors bg-gray-900 border border-gray-700 text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div
              className="space-y-4 overflow-y-auto pr-2"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              {decisions && decisions.length > 0 ? (
                decisions.map((decision, i) => (
                  <DecisionCard key={i} decision={decision} />
                ))
              ) : (
                <div className="py-16 text-center">
                  <div className="mb-4 opacity-30 flex justify-center">
                    <Brain className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold mb-2 text-white">
                    No Decisions Yet
                  </div>
                  <div className="text-sm text-gray-400">
                    AI trading decisions will appear here
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Learning & Performance Analysis */}
      <div className="mb-6 animate-slide-in" style={{ animationDelay: '0.3s' }}>
        <AILearningTab traderId={traderId} />
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  positive,
  subtitle,
}: {
  title: string
  value: string
  change?: number
  positive?: boolean
  subtitle?: string
}) {
  return (
    <Card className="p-5 animate-fade-in">
      <div className="text-xs mb-2 uppercase tracking-wider text-gray-400">
        {title}
      </div>
      <div className="text-2xl font-bold mb-1 text-white tabular-nums">
        {value}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          <div
            className="text-sm font-bold tabular-nums"
            style={{ color: positive ? '#0ECB81' : '#F6465D' }}
          >
            {positive ? '▲' : '▼'} {positive ? '+' : ''}
            {change.toFixed(2)}%
          </div>
        </div>
      )}
      {subtitle && (
        <div className="text-xs mt-2 text-gray-400 tabular-nums">
          {subtitle}
        </div>
      )}
    </Card>
  )
}

// Decision Card Component
function DecisionCard({ decision }: { decision: DecisionRecord }) {
  const [showInputPrompt, setShowInputPrompt] = useState(false)
  const [showCoT, setShowCoT] = useState(false)

  return (
    <div
      className="rounded p-5 transition-all duration-300 hover:translate-y-[-2px] border border-gray-700 bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-white">
            Cycle #{decision.cycle_number}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(decision.timestamp).toLocaleString()}
          </div>
        </div>
        <div
          className="px-3 py-1 rounded text-xs font-bold"
          style={
            decision.success
              ? { background: 'rgba(14, 203, 129, 0.1)', color: '#0ECB81' }
              : { background: 'rgba(246, 70, 93, 0.1)', color: '#F6465D' }
          }
        >
          {decision.success ? 'Success' : 'Failed'}
        </div>
      </div>

      {/* Input Prompt - Collapsible */}
      {decision.input_prompt && (
        <div className="mb-3">
          <button
            onClick={() => setShowInputPrompt(!showInputPrompt)}
            className="flex items-center gap-2 text-sm transition-colors text-blue-400"
          >
            <span className="font-semibold flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Input Prompt
            </span>
            <span className="text-xs">
              {showInputPrompt ? 'Collapse' : 'Expand'}
            </span>
          </button>
          {showInputPrompt && (
            <div className="mt-2 rounded p-4 text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto bg-black border border-gray-700 text-white">
              {decision.input_prompt}
            </div>
          )}
        </div>
      )}

      {/* AI Chain of Thought - Collapsible */}
      {decision.cot_trace && (
        <div className="mb-3">
          <button
            onClick={() => setShowCoT(!showCoT)}
            className="flex items-center gap-2 text-sm transition-colors text-yellow-400"
          >
            <span className="font-semibold flex items-center gap-2">
              <Send className="w-4 h-4" />{' '}
              {stripLeadingIcons('AI Chain of Thought')}
            </span>
            <span className="text-xs">
              {showCoT ? 'Collapse' : 'Expand'}
            </span>
          </button>
          {showCoT && (
            <div className="mt-2 rounded p-4 text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto bg-black border border-gray-700 text-white">
              {decision.cot_trace}
            </div>
          )}
        </div>
      )}

      {/* Decisions Actions */}
      {decision.decisions && decision.decisions.length > 0 && (
        <div className="space-y-2 mb-3">
          {decision.decisions.map((action, j) => (
            <div
              key={j}
              className="flex items-center gap-2 text-sm rounded px-3 py-2 bg-black"
            >
              <span className="font-mono font-bold text-white">
                {action.symbol}
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={
                  action.action.includes('open') || action.action.includes('OPEN')
                    ? {
                        background: 'rgba(96, 165, 250, 0.1)',
                        color: '#60a5fa',
                      }
                    : {
                        background: 'rgba(240, 185, 11, 0.1)',
                        color: '#F0B90B',
                      }
                }
              >
                {action.action}
              </span>
              {action.leverage > 0 && (
                <span className="text-yellow-400">{action.leverage}x</span>
              )}
              {action.price > 0 && (
                <span className="font-mono text-xs text-gray-400">
                  @{action.price.toFixed(4)}
                </span>
              )}
              <span style={{ color: action.success ? '#0ECB81' : '#F6465D' }}>
                {action.success ? (
                  <Check className="w-3 h-3 inline" />
                ) : (
                  <X className="w-3 h-3 inline" />
                )}
              </span>
              {action.error && (
                <span className="text-xs ml-2 text-red-400">{action.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Account State Summary */}
      {decision.account_state && (
        <div className="flex gap-4 text-xs mb-3 rounded px-3 py-2 bg-black text-gray-400">
          <span>
            Balance: {decision.account_state.total_balance.toFixed(2)} USDT
          </span>
          <span>
            Available: {decision.account_state.available_balance.toFixed(2)} USDT
          </span>
          <span>
            Margin: {decision.account_state.margin_used_pct.toFixed(1)}%
          </span>
          <span>Positions: {decision.account_state.position_count}</span>
          <span
            style={{
              color:
                decision.candidate_coins &&
                decision.candidate_coins.length === 0
                  ? '#F6465D'
                  : '#848E9C',
            }}
          >
            Candidates: {decision.candidate_coins?.length || 0}
          </span>
        </div>
      )}

      {/* Candidate Coins Warning */}
      {decision.candidate_coins && decision.candidate_coins.length === 0 && (
        <div className="text-sm rounded px-4 py-3 mb-3 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-1">
              No candidate coins available
            </div>
            <div className="text-xs space-y-1 text-gray-400">
              <div>Possible reasons:</div>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Coin pool API not configured</li>
                <li>API connection timeout</li>
                <li>No custom coins and API failed</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Execution Logs */}
      {decision.execution_log && decision.execution_log.length > 0 && (
        <div className="space-y-1">
          {decision.execution_log.map((log, k) => (
            <div
              key={k}
              className="text-xs font-mono"
              style={{
                color:
                  log.includes('✓') || log.includes('成功')
                    ? '#0ECB81'
                    : '#F6465D',
              }}
            >
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {decision.error_message && (
        <div className="text-sm rounded px-3 py-2 mt-3 flex items-center gap-2 text-red-400 bg-red-500/10">
          <XCircle className="w-4 h-4" /> {decision.error_message}
        </div>
      )}
    </div>
  )
}

