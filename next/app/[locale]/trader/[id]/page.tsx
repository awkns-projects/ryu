"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useGoAuth } from "@/contexts/go-auth-context"
import useSWR from "swr"
import { ArrowLeft, Activity, TrendingUp, Target, DollarSign, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import AppHeader from '@/components/app-header'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface TraderDetailProps {
  params: Promise<{
    id: string
  }>
}

interface TraderConfig {
  trader_id: string
  trader_name: string
  ai_model: string
  exchange: string // Fixed: backend returns 'exchange' not 'exchange_id'
  is_running: boolean
  ai_provider?: string
  start_time?: string
}

interface AccountInfo {
  total_equity: number
  available_balance: number
  total_pnl: number
  total_pnl_pct: number
  position_count: number
  margin_used_pct: number
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
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const authenticatedFetcher = (url: string, token: string) =>
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

export default function TraderDetailPage({ params }: TraderDetailProps) {
  const { id: traderId } = use(params)
  const router = useRouter()
  const locale = useLocale()
  const { user, token } = useGoAuth()
  const [isOwnTrader, setIsOwnTrader] = useState(false)

  console.log('🎯 TraderDetailPage loaded with traderId:', traderId)
  console.log('🎯 Trader ID length:', traderId?.length)
  console.log('🎯 Full params:', params)

  // Smart fetcher that tries authenticated endpoint first, then falls back to public
  const smartFetcher = async (url: string) => {
    console.log('📡 Smart fetching trader config:', { traderId, traderIdLength: traderId?.length, hasToken: !!token })

    // If user is logged in, try authenticated endpoint first (via Next.js API route)
    if (token) {
      try {
        // Use new direct database endpoint to avoid JOIN query failures
        const authUrl = `/api/go/trade/trader-direct/${traderId}`
        console.log('🔐 Trying authenticated endpoint (direct DB):', authUrl)
        const authResponse = await fetch(authUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })

        console.log('📡 Authenticated response status:', authResponse.status)

        if (authResponse.ok) {
          const data = await authResponse.json()
          console.log('✅ Authenticated endpoint success - this is your trader')
          setIsOwnTrader(true)
          return data
        } else {
          const errorData = await authResponse.json().catch(() => ({}))
          console.error('❌ Authenticated endpoint failed:', authResponse.status, errorData)
        }
      } catch (err) {
        console.error('❌ Authenticated endpoint error:', err)
      }
    }

    // Fall back to public endpoint (directly to Go backend)
    const publicUrl = `${BACKEND_URL}/api/traders/${traderId}/public-config`
    console.log('📡 Trying public endpoint:', publicUrl)
    setIsOwnTrader(false)

    try {
      const publicResponse = await fetch(publicUrl)
      console.log('📡 Public response status:', publicResponse.status)

      if (!publicResponse.ok) {
        const errorData = await publicResponse.json().catch(() => ({}))
        console.error('❌ Public endpoint failed:', publicResponse.status, errorData)
        throw new Error(`Trader not found (status: ${publicResponse.status})`)
      }
      console.log('✅ Public endpoint success')
      return await publicResponse.json()
    } catch (err) {
      console.error('❌ Public endpoint error:', err)
      throw err
    }
  }

  // Fetch trader config using smart fetcher
  const { data: traderConfig, error: configError, isLoading: loadingConfig } = useSWR<TraderConfig>(
    `trader-${traderId}`, // Simple key that doesn't change
    () => smartFetcher(traderId),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  // Fetch trader data from competition endpoint (public data)
  const { data: competitionData, error: competitionError } = useSWR(
    `${BACKEND_URL}/api/competition`,
    fetcher,
    { refreshInterval: 15000 }
  )

  // Find trader in competition data
  const traderData = competitionData?.traders?.find((t: any) => t.trader_id === traderId)

  // Calculate initial balance (total_equity - total_pnl)
  const initialBalance = traderData ? traderData.total_equity - traderData.total_pnl : 0

  const isLoading = loadingConfig || (!traderConfig && !configError)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader locale={locale} activeTab={isOwnTrader ? "trade" : "explorer"} />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            <p className="text-white/60">Loading trader details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (configError || !traderConfig) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader locale={locale} activeTab="explorer" />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="max-w-md w-full mx-auto px-6">
            <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Trader Not Found</h2>
              <p className="text-sm text-white/60 mb-6">
                The trader you're looking for doesn't exist or is no longer available.
              </p>
              <button
                onClick={() => router.push(`/${locale}/explorer`)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Explorer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getModelIcon = (model: string): string => {
    const modelLower = model.toLowerCase()
    const icons: Record<string, string> = {
      deepseek: '🤖',
      claude: '🧠',
      gpt: '🎯',
      'gpt-4': '🎯',
      'gpt-3.5': '💡',
      gemini: '✨',
      openai: '🎯',
      anthropic: '🧠',
    }

    for (const [key, icon] of Object.entries(icons)) {
      if (modelLower.includes(key)) {
        return icon
      }
    }
    return '🤖'
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      {/* Sticky Header */}
      <AppHeader locale={locale} activeTab={isOwnTrader ? "trade" : "explorer"} />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(isOwnTrader ? `/${locale}/trade` : `/${locale}/explorer`)}
          className="mb-6 px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-all inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {isOwnTrader ? 'Back to My Traders' : 'Back to Explorer'}
        </button>

        {/* Header */}
        <div className="mb-8 p-6 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getModelIcon(traderConfig.ai_model)}</div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{traderConfig.trader_name}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-white/60">ID: {traderConfig.trader_id}</span>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5",
                    traderConfig.is_running
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      traderConfig.is_running ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                    )}></div>
                    {traderConfig.is_running ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          {traderData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1.5">Model</div>
                <div className="text-lg font-bold text-white">{traderConfig.ai_model}</div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1.5">Exchange</div>
                <div className="text-lg font-bold text-white">{traderConfig.exchange}</div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1.5">Total P&L</div>
                <div className={cn("text-lg font-bold", traderData.total_pnl >= 0 ? "text-green-400" : "text-red-400")}>
                  {traderData.total_pnl >= 0 ? '+' : ''}${traderData.total_pnl.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1.5">ROI</div>
                <div className={cn("text-lg font-bold", traderData.total_pnl_pct >= 0 ? "text-green-400" : "text-red-400")}>
                  {traderData.total_pnl_pct >= 0 ? '+' : ''}{traderData.total_pnl_pct.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {traderData && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Equity</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">${traderData.total_equity.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Active Positions</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{traderData.position_count}</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Margin Used</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{traderData.margin_used_pct.toFixed(1)}%</div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Initial Balance</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">${initialBalance.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                <span className="text-sm text-white/60">AI Model</span>
                <span className="text-sm font-medium text-white">{traderConfig.ai_model}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                <span className="text-sm text-white/60">Exchange</span>
                <span className="text-sm font-medium text-white">{traderConfig.exchange}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                <span className="text-sm text-white/60">Initial Balance</span>
                <span className="text-sm font-medium text-white">${initialBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-white/60">Status</span>
                <span className={cn("text-sm font-medium", traderConfig.is_running ? "text-green-400" : "text-yellow-400")}>
                  {traderConfig.is_running ? 'Running' : 'Paused'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Performance</h2>
            {traderData ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                  <span className="text-sm text-white/60">Total P&L</span>
                  <span className={cn("text-sm font-bold", traderData.total_pnl >= 0 ? "text-green-400" : "text-red-400")}>
                    {traderData.total_pnl >= 0 ? '+' : ''}${traderData.total_pnl.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                  <span className="text-sm text-white/60">ROI</span>
                  <span className={cn("text-sm font-bold", traderData.total_pnl_pct >= 0 ? "text-green-400" : "text-red-400")}>
                    {traderData.total_pnl_pct >= 0 ? '+' : ''}{traderData.total_pnl_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                  <span className="text-sm text-white/60">Active Positions</span>
                  <span className="text-sm font-medium text-white">{traderData.position_count}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-white/60">Margin Used</span>
                  <span className="text-sm font-medium text-white">{traderData.margin_used_pct.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <p className="text-sm">Performance data not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-sm text-blue-400">
            {isOwnTrader
              ? '📊 This is your trader. Live performance updates every 15 seconds.'
              : '📊 This trader is publicly visible on the Explorer. Live performance updates every 15 seconds.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

