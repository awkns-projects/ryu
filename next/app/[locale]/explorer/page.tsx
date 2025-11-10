"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import useSWR from "swr"
import AppHeader from '@/components/app-header'
import PulsingCircle from '@/components/shader/pulsing-circle'
import { Trophy, Activity, FileText, ChevronRight, Loader2, Star, Users, Target, TrendingUp, BarChart3, PieChart, ChevronLeft, Search, Filter, X, CirclePlus, CircleMinus, DollarSign, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ComparisonChartSection } from "@/components/explorer"

// Data types
interface LeaderboardAgent {
  id: string
  name: string
  owner: string
  model: string
  exchange: string
  totalEquity: number
  pnl: number
  pnlPct: number
  roi: number
  openPositions: number
  marginUsedPct: number
  winRate: number
  volume: number
  icon: string
  isRunning: boolean
  equityHistory?: any[]
}

interface RunningAgent {
  id: string
  name: string
  description: string
  model: string // Changed from icon
  status: "active" | "paused"
  deposit: number
  pnl: number
  roi: number // Changed from pnlPercent
  trades: number
}

interface ActivePosition {
  id: string
  agentId: string
  agentName: string
  asset: string
  type: "Long" | "Short"
  leverage: string
  entryPrice: number // Changed from string
  currentPrice: number // Changed from string
  pnl: number
  roi: number // Changed from pnlPercent
  size: number // Added
}

interface Template {
  id: string
  title: string
  description: string
  icon: string
  image?: string
  price: number
  rating: number
  usageCount: number
  agentsCreated: number
  category: string
}

// API response types
interface LeaderboardResponse {
  agents: LeaderboardAgent[]
  totalCount: number
  lastUpdated: string
}

interface AgentsResponse {
  agents: RunningAgent[]
  totalCount: number
  activeCount: number
  pausedCount: number
  lastUpdated: string
}

interface PositionsResponse {
  positions: ActivePosition[]
  totalCount: number
  totalValue: number
  avgLeverage: number
  avgRoi: number
  lastUpdated: string
  message?: string
}

// Fetcher function for useSWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ExplorerPage() {
  const t = useTranslations('explorerPage')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [sortBy, setSortBy] = useState<string>("default")
  const [activeTab, setActiveTab] = useState<"leaderboard" | "agents" | "positions" | "templates">("leaderboard")

  // Pagination state
  const [currentPage, setCurrentPage] = useState({
    leaderboard: 1,
    agents: 1,
    positions: 1,
    templates: 1
  })

  const itemsPerPage = {
    leaderboard: 5,
    agents: 4,
    positions: 4,
    templates: 8
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState({
    leaderboard: '',
    agents: '',
    positions: '',
    templates: ''
  })

  // Filter state
  const [filters, setFilters] = useState({
    leaderboard: { winRate: 'all', volume: 'all' },
    agents: { status: 'all', deposit: 'all' },
    positions: { type: 'all', pnl: 'all' },
    templates: { category: 'all', price: 'all', rating: 'all' }
  })

  // Helper function to get icon for model
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
    return '🤖' // default
  }

  // Helper function to generate consistent values based on string (for consistent ratings/users)
  const getConsistentValue = (str: string, min: number, max: number): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    const normalized = Math.abs(hash % 1000) / 1000
    return Math.floor(min + normalized * (max - min))
  }

  // Fetch real data from API routes
  const { data: leaderboardData, error: leaderboardError, isLoading: loadingLeaderboard } = useSWR<LeaderboardResponse>(
    '/api/go/explorer/leaderboard',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  const { data: agentsData, error: agentsError, isLoading: loadingAgents } = useSWR<AgentsResponse>(
    '/api/go/explorer/agents',
    fetcher,
    { refreshInterval: 15000 } // Refresh every 15 seconds
  )

  const { data: positionsData, error: positionsError, isLoading: loadingPositions } = useSWR<PositionsResponse>(
    '/api/go/explorer/positions',
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  )

  // Fetch templates from Go API
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true)
      try {
        const response = await fetch('/api/go/prompt-templates')
        if (!response.ok) {
          throw new Error('Failed to fetch templates')
        }
        const data = await response.json()

        // Template icon mapping
        const templateIconMap: Record<string, string> = {
          'default': '🤖',
          'nof1': '⚡',
          'taro_long_prompts': '🎯',
          'Hansen': '🔄',
        }

        // Template price mapping
        const templatePriceMap: Record<string, number> = {
          'default': 99,
          'nof1': 149,
          'taro_long_prompts': 199,
          'Hansen': 249,
        }

        // Template category mapping
        const templateCategoryMap: Record<string, string> = {
          'default': 'Trading Bot',
          'nof1': 'Trading Bot',
          'taro_long_prompts': 'Investment',
          'Hansen': 'Trading Bot',
        }

        // Transform templates to Template interface
        const transformedTemplates: Template[] = data.templates?.map((template: { name: string }) => {
          const slugId = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const title = template.name.split('_').map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')

          return {
            id: slugId,
            title: title,
            description: `Advanced AI trading strategy powered by ${template.name} prompt template with optimized risk management`,
            icon: templateIconMap[template.name] || '📊',
            price: templatePriceMap[template.name] || 149,
            rating: (45 + getConsistentValue(template.name, 0, 4)) / 10, // Consistent 4.5-4.9 rating
            usageCount: getConsistentValue(template.name, 800, 2200), // Consistent 800-2200 users
            agentsCreated: getConsistentValue(template.name, 500, 1600), // Consistent 500-1600 agents
            category: templateCategoryMap[template.name] || 'Trading Bot',
          }
        }) || []

        setTemplates(transformedTemplates)
      } catch (err) {
        console.error('Error fetching templates:', err)
        setTemplates([])
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [])

  // Use fetched data or fallback to empty arrays
  const leaderboardAgents: LeaderboardAgent[] = leaderboardData?.agents || []
  const runningAgents: RunningAgent[] = agentsData?.agents || []
  const activePositions: ActivePosition[] = positionsData?.positions || []

  // Generate mock time-series data
  const generateTimeSeriesData = (baseValue: number, volatility: number, points: number = 50) => {
    const data: { time: number; value: number }[] = []
    let currentValue = baseValue
    const now = Date.now()
    const interval = (24 * 60 * 60 * 1000) / points // Spread over 24 hours

    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * volatility
      currentValue += change
      data.push({
        time: now - (points - i) * interval,
        value: currentValue
      })
    }
    return data
  }

  useEffect(() => {
    setTimeout(() => {
      setIsPageLoaded(true)
    }, 50)
  }, [])

  // Reset sort when changing tabs
  useEffect(() => {
    setSortBy("default")
  }, [activeTab])

  // Calculate stats
  const leaderboardStats = {
    totalAgents: leaderboardAgents.length,
    totalVolume: leaderboardAgents.reduce((sum, agent) => sum + agent.volume, 0),
    avgWinRate: (leaderboardAgents.reduce((sum, agent) => sum + agent.winRate, 0) / leaderboardAgents.length).toFixed(1),
    totalOpenPositions: leaderboardAgents.reduce((sum, agent) => sum + agent.openPositions, 0),
    leader: leaderboardAgents.length > 0 ? leaderboardAgents[0] : null
  }

  const agentsStats = {
    totalAgents: runningAgents.length,
    activeAgents: runningAgents.filter(a => a.status === 'active').length,
    totalCapital: runningAgents.reduce((sum, agent) => sum + agent.deposit, 0),
    totalPnl: runningAgents.reduce((sum, agent) => sum + agent.pnl, 0)
  }

  const positionsStats = {
    totalPositions: activePositions.length,
    longPositions: activePositions.filter(p => p.type === 'Long').length,
    shortPositions: activePositions.filter(p => p.type === 'Short').length,
    totalPnl: activePositions.reduce((sum, pos) => sum + pos.pnl, 0),
    avgRoi: activePositions.length > 0 ? (activePositions.reduce((sum, pos) => sum + pos.roi, 0) / activePositions.length).toFixed(2) : '0.00'
  }

  const templatesStats = {
    totalTemplates: templates.length,
    avgRating: templates.length > 0 ? (templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1) : '0.0',
    totalUsers: templates.reduce((sum, t) => sum + t.usageCount, 0),
    totalAgentsCreated: templates.reduce((sum, t) => sum + t.agentsCreated, 0)
  }

  const getFilteredAndSortedData = (data: any[], type: "leaderboard" | "agents" | "positions" | "templates") => {
    let filtered = [...data]

    // Apply search
    const search = searchQuery[type].toLowerCase()
    if (search) {
      filtered = filtered.filter(item => {
        if (type === 'leaderboard') {
          return item.name.toLowerCase().includes(search) || item.owner.toLowerCase().includes(search)
        } else if (type === 'agents') {
          return item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search)
        } else if (type === 'positions') {
          return item.agentName.toLowerCase().includes(search) || item.asset.toLowerCase().includes(search)
        } else if (type === 'templates') {
          return item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search)
        }
        return true
      })
    }

    // Apply filters
    if (type === 'leaderboard') {
      const { winRate, volume } = filters.leaderboard
      if (winRate !== 'all') {
        if (winRate === 'high') filtered = filtered.filter(a => a.winRate >= 70)
        else if (winRate === 'medium') filtered = filtered.filter(a => a.winRate >= 60 && a.winRate < 70)
        else if (winRate === 'low') filtered = filtered.filter(a => a.winRate < 60)
      }
      if (volume !== 'all') {
        if (volume === 'high') filtered = filtered.filter(a => a.volume >= 500000)
        else if (volume === 'medium') filtered = filtered.filter(a => a.volume >= 300000 && a.volume < 500000)
        else if (volume === 'low') filtered = filtered.filter(a => a.volume < 300000)
      }
    } else if (type === 'agents') {
      const { status, deposit } = filters.agents
      if (status !== 'all') {
        filtered = filtered.filter(a => a.status === status)
      }
      if (deposit !== 'all') {
        if (deposit === 'high') filtered = filtered.filter(a => a.deposit >= 7000)
        else if (deposit === 'medium') filtered = filtered.filter(a => a.deposit >= 4000 && a.deposit < 7000)
        else if (deposit === 'low') filtered = filtered.filter(a => a.deposit < 4000)
      }
    } else if (type === 'positions') {
      const { type: posType, pnl } = filters.positions
      if (posType !== 'all') {
        filtered = filtered.filter(p => p.type === posType)
      }
      if (pnl !== 'all') {
        if (pnl === 'profit') filtered = filtered.filter(p => p.pnl > 0)
        else if (pnl === 'loss') filtered = filtered.filter(p => p.pnl < 0)
      }
    } else if (type === 'templates') {
      const { category, price, rating } = filters.templates
      if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category)
      }
      if (price !== 'all') {
        if (price === 'high') filtered = filtered.filter(t => t.price >= 250)
        else if (price === 'medium') filtered = filtered.filter(t => t.price >= 150 && t.price < 250)
        else if (price === 'low') filtered = filtered.filter(t => t.price < 150)
      }
      if (rating !== 'all') {
        if (rating === 'high') filtered = filtered.filter(t => t.rating >= 4.7)
        else if (rating === 'medium') filtered = filtered.filter(t => t.rating >= 4.3 && t.rating < 4.7)
      }
    }

    // Apply sorting
    if (type === 'leaderboard') {
      if (sortBy === 'pnl') filtered.sort((a, b) => b.pnl - a.pnl)
      else if (sortBy === 'trades') filtered.sort((a, b) => b.trades - a.trades)
      else if (sortBy === 'winRate') filtered.sort((a, b) => b.winRate - a.winRate)
      else if (sortBy === 'volume') filtered.sort((a, b) => b.volume - a.volume)
      else filtered.sort((a, b) => b.pnl - a.pnl)
    } else if (type === 'agents') {
      if (sortBy === 'pnl') filtered.sort((a, b) => b.pnl - a.pnl)
      else if (sortBy === 'deposit') filtered.sort((a, b) => b.deposit - a.deposit)
      else if (sortBy === 'trades') filtered.sort((a, b) => b.trades - a.trades)
      else filtered.sort((a, b) => b.pnl - a.pnl)
    } else if (type === 'positions') {
      if (sortBy === 'pnl') filtered.sort((a, b) => b.pnl - a.pnl)
      else if (sortBy === 'roi') filtered.sort((a, b) => b.roi - a.roi)
      else filtered.sort((a, b) => b.roi - a.roi)
    } else if (type === 'templates') {
      if (sortBy === 'price') filtered.sort((a, b) => b.price - a.price)
      else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating)
      else if (sortBy === 'usage') filtered.sort((a, b) => b.usageCount - a.usageCount)
      else filtered.sort((a, b) => b.rating - a.rating)
    }

    return filtered
  }

  const getPaginatedData = (data: any[], type: "leaderboard" | "agents" | "positions" | "templates") => {
    const filteredAndSorted = getFilteredAndSortedData(data, type)
    const start = (currentPage[type] - 1) * itemsPerPage[type]
    const end = start + itemsPerPage[type]
    return filteredAndSorted.slice(start, end)
  }

  const getTotalPages = (data: any[], type: "leaderboard" | "agents" | "positions" | "templates") => {
    const filteredData = getFilteredAndSortedData(data, type)
    return Math.ceil(filteredData.length / itemsPerPage[type])
  }

  const getFilteredCount = (data: any[], type: "leaderboard" | "agents" | "positions" | "templates") => {
    return getFilteredAndSortedData(data, type).length
  }

  const handlePageChange = (type: "leaderboard" | "agents" | "positions" | "templates", page: number) => {
    setCurrentPage(prev => ({ ...prev, [type]: page }))
  }

  const handleSearch = (type: "leaderboard" | "agents" | "positions" | "templates", query: string) => {
    setSearchQuery(prev => ({ ...prev, [type]: query }))
    setCurrentPage(prev => ({ ...prev, [type]: 1 })) // Reset to first page on search
  }

  const handleFilterChange = (type: "leaderboard" | "agents" | "positions" | "templates", filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: { ...prev[type], [filterKey]: value }
    }))
    setCurrentPage(prev => ({ ...prev, [type]: 1 })) // Reset to first page on filter
  }

  const clearFilters = (type: "leaderboard" | "agents" | "positions" | "templates") => {
    setSearchQuery(prev => ({ ...prev, [type]: '' }))
    if (type === 'leaderboard') {
      setFilters(prev => ({ ...prev, leaderboard: { winRate: 'all', volume: 'all' } }))
    } else if (type === 'agents') {
      setFilters(prev => ({ ...prev, agents: { status: 'all', deposit: 'all' } }))
    } else if (type === 'positions') {
      setFilters(prev => ({ ...prev, positions: { type: 'all', pnl: 'all' } }))
    } else if (type === 'templates') {
      setFilters(prev => ({ ...prev, templates: { category: 'all', price: 'all', rating: 'all' } }))
    }
    setCurrentPage(prev => ({ ...prev, [type]: 1 }))
  }

  // Pagination Component
  const Pagination = ({ type, data }: { type: "leaderboard" | "agents" | "positions" | "templates", data: any[] }) => {
    const totalPages = getTotalPages(data, type)
    const current = currentPage[type]

    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages: (number | string)[] = []
      const showPages = 5

      if (totalPages <= showPages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (current <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i)
          pages.push('...')
          pages.push(totalPages)
        } else if (current >= totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = current - 1; i <= current + 1; i++) pages.push(i)
          pages.push('...')
          pages.push(totalPages)
        }
      }

      return pages
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-white/10">
        <button
          onClick={() => handlePageChange(type, current - 1)}
          disabled={current === 1}
          className={cn(
            "p-2 rounded-lg transition-all",
            current === 1
              ? "text-white/30 cursor-not-allowed"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 text-white/40">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(type, page as number)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                current === page
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => handlePageChange(type, current + 1)}
          disabled={current === totalPages}
          className={cn(
            "p-2 rounded-lg transition-all",
            current === totalPages
              ? "text-white/30 cursor-not-allowed"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // Show loading state while initial data is being fetched
  const isInitialLoading = (!leaderboardData && !leaderboardError) || isPending

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          <p className="text-white/60">Loading Explorer Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-black pb-20 md:pb-0 transition-all duration-700 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Sticky Header */}
      <AppHeader locale={locale} activeTab="explorer" />

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 transition-all duration-700 delay-200 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="text-center mb-6">
            <h1 className={`text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-3 tracking-tight transition-all duration-700 delay-300 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
              {t('title')} <span className="font-semibold instrument">{t('titleHighlight')}</span>
            </h1>
            <p className={`text-xs md:text-sm text-white/60 max-w-2xl mx-auto px-4 transition-all duration-700 delay-400 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              {t('description')}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className={`w-full overflow-x-auto scrollbar-hide transition-all duration-700 delay-500 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex justify-center min-w-full px-4">
              <div className="inline-flex items-center rounded-xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl p-1 shadow-lg">
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                    activeTab === "leaderboard"
                      ? "bg-white/10 text-white shadow-md border border-white/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{t('leaderboard.title')}</span>
                </button>
                <button
                  onClick={() => setActiveTab("agents")}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                    activeTab === "agents"
                      ? "bg-white/10 text-white shadow-md border border-white/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{t('agents.title')}</span>
                </button>
                <button
                  onClick={() => setActiveTab("positions")}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                    activeTab === "positions"
                      ? "bg-white/10 text-white shadow-md border border-white/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <Target className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{t('positions.title')}</span>
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                    activeTab === "templates"
                      ? "bg-white/10 text-white shadow-md border border-white/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{t('templates.title')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <div className={`transition-all duration-500 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">{t('leaderboard.title')}</h2>
                      <p className="text-xs text-white/40 mt-0.5">{t('leaderboard.description')}</p>
                    </div>
                  </div>

                  {/* Leader Spotlight */}
                  {leaderboardStats.leader && (
                    <div className="hidden md:flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-white/40 mb-1">Current Leader</div>
                        <div className="text-base font-bold text-yellow-400">{leaderboardStats.leader.name}</div>
                        <div className={cn(
                          "text-sm font-semibold",
                          leaderboardStats.leader.pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {leaderboardStats.leader.pnl >= 0 ? '+' : ''}{leaderboardStats.leader.pnlPct.toFixed(2)}%
                        </div>
                      </div>
                      <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs font-medium hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                    >
                      <option value="default" className="bg-black">Sort by P&L</option>
                      <option value="pnl" className="bg-black">P&L</option>
                      <option value="trades" className="bg-black">Open Positions</option>
                      <option value="winRate" className="bg-black">Win Rate (est)</option>
                      <option value="volume" className="bg-black">Volume (est)</option>
                    </select>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-5 space-y-3">
                  <div className="flex flex-col gap-2">
                    {/* Search */}
                    <div className="w-full relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Search by agent name or owner..."
                        value={searchQuery.leaderboard}
                        onChange={(e) => handleSearch('leaderboard', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      <select
                        value={filters.leaderboard.winRate}
                        onChange={(e) => handleFilterChange('leaderboard', 'winRate', e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Win Rates</option>
                        <option value="high" className="bg-black">High (≥70%)</option>
                        <option value="medium" className="bg-black">Medium (60-70%)</option>
                        <option value="low" className="bg-black">Low (&lt;60%)</option>
                      </select>

                      <select
                        value={filters.leaderboard.volume}
                        onChange={(e) => handleFilterChange('leaderboard', 'volume', e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Volumes</option>
                        <option value="high" className="bg-black">High (≥$500K)</option>
                        <option value="medium" className="bg-black">Medium ($300-500K)</option>
                        <option value="low" className="bg-black">Low (&lt;$300K)</option>
                      </select>

                      {(searchQuery.leaderboard || filters.leaderboard.winRate !== 'all' || filters.leaderboard.volume !== 'all') && (
                        <button
                          onClick={() => clearFilters('leaderboard')}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-2"
                          title="Clear filters"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Showing {getFilteredCount(leaderboardAgents, 'leaderboard')} of {leaderboardAgents.length} agents
                  </div>
                </div>

                {/* Leaderboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Agents</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{leaderboardStats.totalAgents}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-green-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Volume</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">${(leaderboardStats.totalVolume / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Avg Win Rate</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{leaderboardStats.avgWinRate}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Open Positions</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{leaderboardStats.totalOpenPositions.toLocaleString()}</div>
                  </div>
                </div>

                {/* Leaderboard Time-Series Chart */}
                <div className="mb-6 p-5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">Performance Comparison</h3>
                      <p className="text-[10px] text-white/40">Real-time PnL % - Last 24 Hours</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-white/40" />
                  </div>

                  {/* Time-Series Line Chart */}
                  <div className="relative h-64 w-full">
                    <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="125" x2="800" y2="125" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                      {/* Generate and draw lines for top 3 agents */}
                      {leaderboardAgents.slice(0, 3).map((agent, agentIndex) => {
                        // Use real equity history if available, otherwise generate mock data
                        const timeSeriesData = agent.equityHistory && agent.equityHistory.length > 0
                          ? agent.equityHistory.map((point: any) => ({
                            time: new Date(point.timestamp).getTime(),
                            value: point.total_pnl_pct || ((point.total_equity - point.balance) / point.balance * 100)
                          }))
                          : generateTimeSeriesData(agent.roi - 20, 3)

                        // Calculate range for all top 3 agents for consistent scaling
                        const allData = leaderboardAgents.slice(0, 3).flatMap(a =>
                          a.equityHistory && a.equityHistory.length > 0
                            ? a.equityHistory.map((p: any) => p.total_pnl_pct || ((p.total_equity - p.balance) / p.balance * 100))
                            : generateTimeSeriesData(a.roi - 20, 3).map(d => d.value)
                        )
                        const maxValue = Math.max(...allData)
                        const minValue = Math.min(...allData)
                        const range = Math.max(maxValue - minValue, 1) // Prevent division by zero

                        const points = timeSeriesData.map((point: any, i: number) => {
                          const x = (i / (timeSeriesData.length - 1)) * 800
                          const y = 250 - ((point.value - minValue) / range) * 200 - 25
                          return `${x},${y}`
                        }).join(' ')

                        const colors = [
                          'rgb(147, 51, 234)', // purple
                          'rgb(59, 130, 246)', // blue
                          'rgb(96, 165, 250)'  // light blue
                        ]

                        const gradientIds = ['grad1', 'grad2', 'grad3']

                        return (
                          <g key={agent.id}>
                            <defs>
                              <linearGradient id={gradientIds[agentIndex]} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={colors[agentIndex]} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={colors[agentIndex]} stopOpacity="1" />
                              </linearGradient>
                            </defs>
                            <polyline
                              points={points}
                              fill="none"
                              stroke={`url(#${gradientIds[agentIndex]})`}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )
                      })}
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-[10px] text-white/30 tabular-nums">
                      <span>150%</span>
                      <span>0%</span>
                      <span>-150%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                    {leaderboardAgents.slice(0, 3).map((agent, index) => {
                      const colors = [
                        'rgb(147, 51, 234)', // purple
                        'rgb(59, 130, 246)', // blue  
                        'rgb(96, 165, 250)'  // light blue
                      ]
                      return (
                        <div key={agent.id} className="flex items-center gap-2">
                          <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                          <span className="text-[10px] text-white/60 font-medium">{agent.icon} {agent.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {getPaginatedData(leaderboardAgents, 'leaderboard').map((agent, index) => {
                    const actualIndex = (currentPage.leaderboard - 1) * itemsPerPage.leaderboard + index
                    return (
                      <div
                        key={agent.id}
                        className="p-4 md:p-5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => router.push(`/${locale}/agent/${agent.id}`)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                        {/* Mobile Layout */}
                        <div className="md:hidden relative z-10">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={cn(
                              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                              actualIndex === 0 ? "bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 text-yellow-400 border border-yellow-400/30" :
                                actualIndex === 1 ? "bg-gradient-to-br from-slate-300/20 to-slate-500/20 text-slate-300 border border-slate-300/30" :
                                  actualIndex === 2 ? "bg-gradient-to-br from-orange-400/20 to-orange-600/20 text-orange-400 border border-orange-400/30" :
                                    "bg-white/[0.03] text-white/60 border border-white/[0.08]"
                            )}>
                              <span className="tabular-nums">{actualIndex + 1}</span>
                            </div>
                            <div className="text-2xl">{agent.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm group-hover:text-white/90 transition-colors line-clamp-1">{agent.name}</h3>
                              <p className="text-xs text-white/30 mt-0.5">by {agent.owner}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 flex-shrink-0" />
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Equity</div>
                              <div className="text-sm font-bold text-white tabular-nums">
                                ${agent.totalEquity.toFixed(0)}
                              </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">P&L</div>
                              <div className={cn("text-sm font-bold tracking-tight tabular-nums", agent.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                {agent.pnl >= 0 ? '+' : ''}{agent.pnlPct.toFixed(2)}%
                              </div>
                              <div className={cn("text-[10px] font-medium tabular-nums", agent.pnl >= 0 ? "text-green-400/60" : "text-red-400/60")}>
                                {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toFixed(2)}
                              </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Open Pos</div>
                              <div className="text-sm font-semibold text-white tabular-nums">{agent.openPositions}</div>
                              <div className="text-[10px] text-white/40 tabular-nums">{agent.marginUsedPct.toFixed(1)}% margin</div>
                            </div>
                            <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Win Rate</div>
                              <div className="text-sm font-semibold text-white tabular-nums">{agent.winRate.toFixed(1)}%</div>
                              <div className="text-[10px] text-white/40">est</div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex items-center gap-4 relative z-10">
                          {/* Rank with Medal */}
                          <div className={cn(
                            "flex-shrink-0 w-12 h-10 rounded-lg flex items-center justify-center gap-1",
                            actualIndex === 0 ? "bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30" :
                              actualIndex === 1 ? "bg-gradient-to-br from-slate-300/20 to-slate-500/20 border border-slate-300/30" :
                                actualIndex === 2 ? "bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-orange-400/30" :
                                  "bg-white/[0.03] border border-white/[0.08]"
                          )}>
                            {actualIndex < 3 && (
                              <Medal className={cn(
                                "w-4 h-4",
                                actualIndex === 0 ? "text-yellow-400" :
                                  actualIndex === 1 ? "text-slate-300" :
                                    "text-orange-400"
                              )} />
                            )}
                            <span className={cn(
                              "text-sm font-bold tabular-nums",
                              actualIndex === 0 ? "text-yellow-400" :
                                actualIndex === 1 ? "text-slate-300" :
                                  actualIndex === 2 ? "text-orange-400" :
                                    "text-white/60"
                            )}>{actualIndex + 1}</span>
                          </div>

                          {/* Agent Info */}
                          <div className="text-xl">{agent.icon}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm group-hover:text-white/90 transition-colors">{agent.name}</h3>
                            <p className="text-xs text-white/30 mt-0.5">
                              <span className="font-mono">{agent.model.toUpperCase()}</span> + <span className="font-mono">{agent.exchange.toUpperCase()}</span>
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-6">
                            {/* Total Equity */}
                            <div className="text-right">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Equity</div>
                              <div className="text-sm font-bold text-white tabular-nums mt-0.5">
                                ${agent.totalEquity.toFixed(0)}
                              </div>
                            </div>

                            {/* P&L */}
                            <div className="text-right min-w-[90px]">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">P&L</div>
                              <div className={cn("text-base font-bold tracking-tight tabular-nums", agent.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                {agent.pnl >= 0 ? '+' : ''}{agent.pnlPct.toFixed(2)}%
                              </div>
                              <div className={cn("text-xs font-medium tabular-nums", agent.pnl >= 0 ? "text-green-400/60" : "text-red-400/60")}>
                                {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toFixed(2)}
                              </div>
                            </div>

                            {/* Open Positions + Margin */}
                            <div className="text-right">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Open Pos</div>
                              <div className="text-sm font-semibold text-white mt-0.5 tabular-nums">{agent.openPositions}</div>
                              <div className="text-xs text-white/40 tabular-nums">{agent.marginUsedPct.toFixed(1)}%</div>
                            </div>

                            {/* Win Rate */}
                            <div className="text-right">
                              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Win Rate</div>
                              <div className="text-sm font-semibold text-white mt-0.5 tabular-nums">{agent.winRate.toFixed(1)}%</div>
                              <div className="text-xs text-white/40">est</div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Pagination type="leaderboard" data={leaderboardAgents} />
              </div>

              {/* Multi-Trader Comparison Chart */}
              <div className="mt-8">
                <ComparisonChartSection traders={leaderboardAgents.map(agent => ({
                  id: agent.id,
                  name: agent.name,
                  totalEquity: agent.totalEquity,
                  pnl: agent.pnl,
                  roi: agent.roi,
                  icon: agent.icon
                }))} />
              </div>
            </div>
          )}

          {/* Running Agents Tab */}
          {activeTab === "agents" && (
            <div className={`transition-all duration-500 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">{t('agents.title')}</h2>
                      <p className="text-xs text-white/40 mt-0.5">{t('agents.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs font-medium hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                    >
                      <option value="default" className="bg-black">Sort by P&L</option>
                      <option value="pnl" className="bg-black">P&L</option>
                      <option value="deposit" className="bg-black">Deposit</option>
                      <option value="trades" className="bg-black">Open Positions</option>
                    </select>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-5 space-y-3">
                  <div className="flex flex-col gap-2">
                    {/* Search */}
                    <div className="w-full relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Search by agent name or description..."
                        value={searchQuery.agents}
                        onChange={(e) => handleSearch('agents', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      <select
                        value={filters.agents.status}
                        onChange={(e) => handleFilterChange('agents', 'status', e.target.value)}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Status</option>
                        <option value="active" className="bg-black">Active</option>
                        <option value="paused" className="bg-black">Paused</option>
                      </select>

                      <select
                        value={filters.agents.deposit}
                        onChange={(e) => handleFilterChange('agents', 'deposit', e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Deposits</option>
                        <option value="high" className="bg-black">High (≥$7K)</option>
                        <option value="medium" className="bg-black">Medium ($4-7K)</option>
                        <option value="low" className="bg-black">Low (&lt;$4K)</option>
                      </select>

                      {(searchQuery.agents || filters.agents.status !== 'all' || filters.agents.deposit !== 'all') && (
                        <button
                          onClick={() => clearFilters('agents')}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-2"
                          title="Clear filters"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Showing {getFilteredCount(runningAgents, 'agents')} of {runningAgents.length} agents
                  </div>
                </div>

                {/* Agents Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Agents</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{agentsStats.totalAgents}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <PieChart className="w-3.5 h-3.5 text-green-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Active</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{agentsStats.activeAgents}<span className="text-xs text-white/40 ml-1">/ {agentsStats.totalAgents}</span></div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-purple-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Capital</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">${(agentsStats.totalCapital / 1000).toFixed(0)}K</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total P&L</span>
                    </div>
                    <div className={cn("text-xl font-bold tabular-nums", agentsStats.totalPnl >= 0 ? "text-green-400" : "text-red-400")}>
                      {agentsStats.totalPnl >= 0 ? '+' : ''}${agentsStats.totalPnl.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Agents Time-Series Performance Chart */}
                <div className="mb-6 p-5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">Agent Performance Trends</h3>
                      <p className="text-[10px] text-white/40">Cumulative Returns % - Last 24 Hours</p>
                    </div>
                    <Activity className="w-4 h-4 text-white/40" />
                  </div>

                  {/* Time-Series Line Chart */}
                  <div className="relative h-64 w-full">
                    <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="125" x2="800" y2="125" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                      {/* Generate and draw lines for top 4 agents */}
                      {runningAgents.slice(0, 4).map((agent, agentIndex) => {
                        // Use real equity history if available, otherwise generate mock data
                        const timeSeriesData = agent.equityHistory && agent.equityHistory.length > 0
                          ? agent.equityHistory.map((point: any) => ({
                            time: new Date(point.timestamp).getTime(),
                            value: point.total_pnl_pct || ((point.total_equity - point.balance) / point.balance * 100)
                          }))
                          : generateTimeSeriesData(agent.roi * 0.3, 2, 60)

                        // Calculate range for all top 4 agents for consistent scaling
                        const allData = runningAgents.slice(0, 4).flatMap(a =>
                          a.equityHistory && a.equityHistory.length > 0
                            ? a.equityHistory.map((p: any) => p.total_pnl_pct || ((p.total_equity - p.balance) / p.balance * 100))
                            : generateTimeSeriesData(a.roi * 0.3, 2, 60).map(d => d.value)
                        )
                        const maxValue = Math.max(...allData)
                        const minValue = Math.min(...allData)
                        const range = Math.max(maxValue - minValue, 1) // Prevent division by zero

                        const points = timeSeriesData.map((point: any, i: number) => {
                          const x = (i / (timeSeriesData.length - 1)) * 800
                          const y = 250 - ((point.value - minValue) / range) * 200 - 25
                          return `${x},${y}`
                        }).join(' ')

                        const colors = [
                          'rgb(34, 197, 94)',   // green
                          'rgb(59, 130, 246)',  // blue
                          'rgb(168, 85, 247)',  // purple
                          'rgb(239, 68, 68)'    // red
                        ]

                        const gradientIds = ['agentGrad1', 'agentGrad2', 'agentGrad3', 'agentGrad4']

                        return (
                          <g key={agent.id}>
                            <defs>
                              <linearGradient id={gradientIds[agentIndex]} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={colors[agentIndex]} stopOpacity="0.6" />
                                <stop offset="100%" stopColor={colors[agentIndex]} stopOpacity="0.9" />
                              </linearGradient>
                            </defs>
                            <polyline
                              points={points}
                              fill="none"
                              stroke={`url(#${gradientIds[agentIndex]})`}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )
                      })}
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-[10px] text-white/30 tabular-nums">
                      <span>50%</span>
                      <span>0%</span>
                      <span>-50%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                    {runningAgents.slice(0, 4).map((agent, index) => {
                      const colors = [
                        'rgb(34, 197, 94)',   // green
                        'rgb(59, 130, 246)',  // blue
                        'rgb(168, 85, 247)',  // purple
                        'rgb(239, 68, 68)'    // red
                      ]
                      return (
                        <div key={agent.id} className="flex items-center gap-2">
                          <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                          <span className="text-[10px] text-white/60 font-medium">{getModelIcon(agent.model)} {agent.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {getPaginatedData(runningAgents, 'agents').map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer group relative overflow-hidden"
                      onClick={() => router.push(`/${locale}/agent/${agent.id}`)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      <div className="relative z-10">
                        <div className="flex items-start gap-2.5 mb-2.5">
                          <div className="text-2xl mt-0.5">{getModelIcon(agent.model)}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm group-hover:text-white/90 transition-colors">{agent.name}</h3>
                            <p className="text-[10px] text-white/30 line-clamp-1 mt-0.5">{agent.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05] text-white/60 hover:text-green-400"
                              onClick={(e) => {
                                e.stopPropagation()
                                // TODO: Handle deposit funds
                              }}
                              title="Deposit Funds"
                            >
                              <CirclePlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05] text-white/60 hover:text-amber-400"
                              onClick={(e) => {
                                e.stopPropagation()
                                // TODO: Handle withdraw funds
                              }}
                              title="Withdraw Funds"
                            >
                              <CircleMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1",
                            agent.status === "active"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          )}>
                            <div className={cn(
                              "w-1 h-1 rounded-full",
                              agent.status === "active" ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                            )}></div>
                            {agent.status === "active" ? t('agents.active') : t('agents.paused')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/[0.06]">
                          <div>
                            <span className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">{t('agents.deposit')}</span>
                            <div className="font-semibold text-white mt-0.5 tabular-nums">${agent.deposit.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">{t('agents.pnl')}</span>
                            <div className={cn("font-semibold mt-0.5 tabular-nums", agent.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                              {agent.pnl >= 0 ? '+' : ''}${Math.abs(agent.pnl).toFixed(2)} ({agent.roi >= 0 ? '+' : ''}{agent.roi.toFixed(2)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination type="agents" data={runningAgents} />
              </div>
            </div>
          )}

          {/* Active Positions Tab */}
          {activeTab === "positions" && (
            <div className={`transition-all duration-500 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">{t('positions.title')}</h2>
                      <p className="text-xs text-white/40 mt-0.5">{t('positions.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs font-medium hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                    >
                      <option value="default" className="bg-black">Sort by P&L %</option>
                      <option value="pnl" className="bg-black">P&L ($)</option>
                      <option value="roi" className="bg-black">P&L %</option>
                    </select>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-5 space-y-3">
                  <div className="flex flex-col gap-2">
                    {/* Search */}
                    <div className="w-full relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Search by agent name or asset..."
                        value={searchQuery.positions}
                        onChange={(e) => handleSearch('positions', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      <select
                        value={filters.positions.type}
                        onChange={(e) => handleFilterChange('positions', 'type', e.target.value)}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Types</option>
                        <option value="Long" className="bg-black">Long</option>
                        <option value="Short" className="bg-black">Short</option>
                      </select>

                      <select
                        value={filters.positions.pnl}
                        onChange={(e) => handleFilterChange('positions', 'pnl', e.target.value)}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All P&L</option>
                        <option value="profit" className="bg-black">Profit</option>
                        <option value="loss" className="bg-black">Loss</option>
                      </select>

                      {(searchQuery.positions || filters.positions.type !== 'all' || filters.positions.pnl !== 'all') && (
                        <button
                          onClick={() => clearFilters('positions')}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-2"
                          title="Clear filters"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Showing {getFilteredCount(activePositions, 'positions')} of {activePositions.length} positions
                  </div>
                </div>

                {/* Positions Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Positions</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{positionsStats.totalPositions}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <PieChart className="w-3.5 h-3.5 text-blue-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Long / Short</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">
                      <span className="text-green-400">{positionsStats.longPositions}</span>
                      <span className="text-white/30 mx-1">/</span>
                      <span className="text-red-400">{positionsStats.shortPositions}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-green-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total P&L</span>
                    </div>
                    <div className={cn("text-xl font-bold tabular-nums", positionsStats.totalPnl >= 0 ? "text-green-400" : "text-red-400")}>
                      {positionsStats.totalPnl >= 0 ? '+' : ''}${positionsStats.totalPnl.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Avg ROI</span>
                    </div>
                    <div className={cn("text-xl font-bold tabular-nums", parseFloat(positionsStats.avgRoi) >= 0 ? "text-green-400" : "text-red-400")}>
                      {parseFloat(positionsStats.avgRoi) >= 0 ? '+' : ''}{positionsStats.avgRoi}%
                    </div>
                  </div>
                </div>

                {/* Positions Distribution Chart */}
                <div className="mb-6 p-5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">Position Type Distribution</h3>
                      <p className="text-[10px] text-white/40">Long vs Short Performance Over Time</p>
                    </div>
                    <PieChart className="w-4 h-4 text-white/40" />
                  </div>

                  {/* Stacked Area Chart */}
                  <div className="relative h-64 w-full">
                    <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="62.5" x2="800" y2="62.5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="125" x2="800" y2="125" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="187.5" x2="800" y2="187.5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                      {/* Long positions area */}
                      {(() => {
                        const longData = generateTimeSeriesData(60, 5, 50)
                        const longPath = longData.map((point, i) => {
                          const x = (i / (longData.length - 1)) * 800
                          const y = 250 - (point.value / 100) * 125
                          return i === 0 ? `M ${x} 250 L ${x} ${y}` : `L ${x} ${y}`
                        }).join(' ') + ' L 800 250 Z'

                        return (
                          <>
                            <defs>
                              <linearGradient id="longGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <path d={longPath} fill="url(#longGradient)" stroke="rgb(34, 197, 94)" strokeWidth="2" />
                          </>
                        )
                      })()}

                      {/* Short positions area */}
                      {(() => {
                        const shortData = generateTimeSeriesData(40, 4, 50)
                        const shortPath = shortData.map((point, i) => {
                          const x = (i / (shortData.length - 1)) * 800
                          const y = 250 - (point.value / 100) * 125
                          return i === 0 ? `M ${x} 250 L ${x} ${y}` : `L ${x} ${y}`
                        }).join(' ') + ' L 800 250 Z'

                        return (
                          <>
                            <defs>
                              <linearGradient id="shortGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <path d={shortPath} fill="url(#shortGradient)" stroke="rgb(239, 68, 68)" strokeWidth="2" />
                          </>
                        )
                      })()}
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-[10px] text-white/30 tabular-nums">
                      <span>100%</span>
                      <span>50%</span>
                      <span>0%</span>
                    </div>
                  </div>

                  {/* Legend with stats */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Long Positions</div>
                        <div className="text-sm font-bold text-green-400 mt-0.5 tabular-nums">{positionsStats.longPositions}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Short Positions</div>
                        <div className="text-sm font-bold text-red-400 mt-0.5 tabular-nums">{positionsStats.shortPositions}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {getPaginatedData(activePositions, 'positions').map((position) => (
                    <div
                      key={position.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden"
                      onClick={() => router.push(`/${locale}/position/${position.id}`)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{position.asset === 'BTC' ? '₿' : position.asset === 'ETH' ? 'Ξ' : '◎'}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors">
                              {position.asset} {position.type} {position.leverage}
                            </h3>
                            <p className="text-xs text-white/40 mt-0.5">{position.agentName}</p>
                          </div>
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-semibold",
                            position.type === 'Long'
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          )}>
                            {position.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3 pt-3 border-t border-white/10">
                          <div>
                            <span className="text-white/40 uppercase tracking-wider">{t('positions.entry')}</span>
                            <div className="font-medium text-white mt-1">${position.entryPrice.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-white/40 uppercase tracking-wider">{t('positions.current')}</span>
                            <div className="font-medium text-white mt-1">${position.currentPrice.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-white/40 uppercase tracking-wider">{t('positions.pnl')}</span>
                            <div className={cn("font-bold mt-1", position.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                              {position.pnl >= 0 ? '+' : ''}${position.pnl}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={cn("text-2xl font-bold tracking-tight", position.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                            {position.roi >= 0 ? '+' : ''}{position.roi.toFixed(2)}%
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination type="positions" data={activePositions} />
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className={`transition-all duration-500 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      {isLoadingTemplates ? (
                        <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">{t('templates.title')}</h2>
                      <p className="text-xs text-white/40 mt-0.5">{t('templates.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs font-medium hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      disabled={isLoadingTemplates}
                    >
                      <option value="default" className="bg-black">Sort by Rating</option>
                      <option value="rating" className="bg-black">Rating</option>
                      <option value="usage" className="bg-black">Most Used</option>
                      <option value="price" className="bg-black">Price</option>
                    </select>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-5 space-y-3">
                  <div className="flex flex-col gap-2">
                    {/* Search */}
                    <div className="w-full relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Search by template name or description..."
                        value={searchQuery.templates}
                        onChange={(e) => handleSearch('templates', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      <select
                        value={filters.templates.category}
                        onChange={(e) => handleFilterChange('templates', 'category', e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Categories</option>
                        <option value="Trading Bot" className="bg-black">Trading Bot</option>
                        <option value="Investment" className="bg-black">Investment</option>
                      </select>

                      <select
                        value={filters.templates.price}
                        onChange={(e) => handleFilterChange('templates', 'price', e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Prices</option>
                        <option value="high" className="bg-black">High (≥$250)</option>
                        <option value="medium" className="bg-black">Medium ($150-250)</option>
                        <option value="low" className="bg-black">Low (&lt;$150)</option>
                      </select>

                      <select
                        value={filters.templates.rating}
                        onChange={(e) => handleFilterChange('templates', 'rating', e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-xs hover:bg-white/[0.05] transition-all outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-black">All Ratings</option>
                        <option value="high" className="bg-black">High (≥4.7)</option>
                        <option value="medium" className="bg-black">Medium (4.3-4.7)</option>
                      </select>

                      {(searchQuery.templates || filters.templates.category !== 'all' || filters.templates.price !== 'all' || filters.templates.rating !== 'all') && (
                        <button
                          onClick={() => clearFilters('templates')}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-2"
                          title="Clear filters"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Showing {getFilteredCount(templates, 'templates')} of {templates.length} templates
                  </div>
                </div>

                {/* Templates Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-green-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Templates</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{templatesStats.totalTemplates}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400/70 fill-yellow-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Avg Rating</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{templatesStats.avgRating}<span className="text-xs text-white/40 ml-1">/ 5</span></div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Users</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{(templatesStats.totalUsers / 1000).toFixed(1)}K</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Activity className="w-3.5 h-3.5 text-purple-400/70" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Agents Created</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{(templatesStats.totalAgentsCreated / 1000).toFixed(1)}K</div>
                  </div>
                </div>

                {/* Templates Usage Comparison Chart */}
                <div className="mb-6 p-5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Top 10 Templates by Usage</h3>
                    <Users className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="space-y-3">
                    {templates
                      .sort((a, b) => b.usageCount - a.usageCount)
                      .slice(0, 10)
                      .map((template, index) => {
                        const maxUsage = Math.max(...templates.map(t => t.usageCount))
                        const barWidth = (template.usageCount / maxUsage) * 100

                        return (
                          <div key={template.id} className="group">
                            <div className="flex items-center gap-3 mb-1.5">
                              <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-white/[0.05] text-white/60 border border-white/[0.08]">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-lg">{template.icon}</span>
                                  <span className="text-xs font-medium text-white/80 truncate">{template.title}</span>
                                </div>
                                <div className="flex items-center gap-3 ml-3">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-[10px] text-white/40 tabular-nums">{template.rating}</span>
                                  </div>
                                  <span className="text-xs font-bold text-blue-400 tabular-nums">
                                    {template.usageCount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-9 relative h-2 bg-white/[0.03] rounded-full overflow-hidden">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500/80 to-pink-400/80"
                                style={{ width: `${barWidth}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {isLoadingTemplates ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-green-400 mb-4" />
                    <p className="text-white/40 text-sm">Loading templates from Go API...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <FileText className="w-12 h-12 text-white/20 mb-4" />
                    <p className="text-white/40 text-sm">No templates available</p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {getPaginatedData(templates, 'templates').map((template) => (
                        <div
                          key={template.id}
                          className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden"
                          onClick={() => router.push(`/${locale}/templates/${template.id}`)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-200%] group-hover:translate-y-[200%] transition-transform duration-1000"></div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-4xl">{template.icon}</div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors line-clamp-1">{template.title}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-white/50">{template.rating}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-white/40 mb-4 line-clamp-2 leading-relaxed">{template.description}</p>
                            <div className="flex items-center justify-between mb-4 text-xs text-white/40">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{template.usageCount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                <span>{template.agentsCreated} {t('templates.agents')}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                              <div className="text-xl font-bold text-white">${template.price}</div>
                              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Pagination type="templates" data={templates} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Trading Tutor */}
      <PulsingCircle />
    </div>
  )
}
