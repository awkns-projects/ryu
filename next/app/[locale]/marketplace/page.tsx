"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createChart, ColorType, LineStyle, AreaSeries, type Time } from 'lightweight-charts'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import MarketplaceHeader from '@/components/marketplace-header'
import PulsingCircle from '@/components/shader/pulsing-circle'

type Agent = {
  id: string
  name: string
  description: string
  price: number
  rating: number
  users: number
  icon: string
  category: string
  tags: string[]
}

type Position = {
  id: string
  name: string
  description: string
  price: number
  rating: number
  users: number
  icon: string
  entryPrice: string
  liquidation: string
  leverage: string
  type: "Long" | "Short"
  reason: string
  targetPrice: string
  riskReward: string
  chartData: number[]
  priceChange: string
  duration: string
  saleType: "fixed" | "auction"
  asset: string
  currentBid?: number
  minBid?: number
  auctionEndTime?: Date
  totalBids?: number
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

// Static example agents (defined outside component to avoid recreation)
const STATIC_AGENTS: Agent[] = [
  {
    id: "momentum-master",
    name: "Momentum Master",
    description: "High-frequency trading strategy using advanced momentum indicators and machine learning for rapid market movements",
    price: 299,
    rating: 4.8,
    users: 1843,
    icon: "/images/agents/4.png",
    category: "Trading Bot",
    tags: ["Momentum", "High-Frequency", "ML"]
  },
  {
    id: "volatility-hunter",
    name: "Volatility Hunter",
    description: "Capitalize on market volatility with AI-powered risk management and dynamic position sizing for maximum profit",
    price: 199,
    rating: 4.6,
    users: 1292,
    icon: "/images/agents/5.png",
    category: "Trading Bot",
    tags: ["Volatility", "Risk Management", "AI"]
  },
  {
    id: "dca-smart-bot",
    name: "DCA Smart Bot",
    description: "Dollar-cost averaging strategy optimized by AI for maximum long-term gains with minimal risk exposure",
    price: 149,
    rating: 4.9,
    users: 2656,
    icon: "/images/agents/6.png",
    category: "Investment",
    tags: ["DCA", "Long-term", "Passive"]
  },
  {
    id: "scalper-pro",
    name: "Scalper Pro",
    description: "Lightning-fast scalping strategy for quick profits on small price movements with high win rate",
    price: 349,
    rating: 4.7,
    users: 987,
    icon: "/images/agents/7.png",
    category: "Trading Bot",
    tags: ["Scalping", "High-Speed", "Precision"]
  },
  {
    id: "trend-rider",
    name: "Trend Rider",
    description: "Ride major market trends with intelligent entry and exit points powered by deep learning algorithms",
    price: 229,
    rating: 4.8,
    users: 1543,
    icon: "/images/agents/8.png",
    category: "Trading Bot",
    tags: ["Trend Following", "Deep Learning", "Smart"]
  },
  {
    id: "range-master",
    name: "Range Master",
    description: "Trade within established price ranges using support and resistance levels with high accuracy",
    price: 179,
    rating: 4.5,
    users: 876,
    icon: "/images/agents/9.png",
    category: "Trading Bot",
    tags: ["Range Trading", "Technical Analysis", "Stable"]
  },
]

export default function MarketplacePage() {
  const t = useTranslations('marketplacePage')
  const tSection = useTranslations('marketplaceSection')
  const params = useParams()
  const router = useRouter()
  const currentLocale = useLocale()
  const locale = params?.locale as string || 'en'

  const [activeTab, setActiveTab] = useState<"agents" | "positions">("agents")
  const [saleTypeFilter, setSaleTypeFilter] = useState<"all" | "fixed" | "auction">("all")
  const [assetFilter, setAssetFilter] = useState<string[]>([])
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"trending" | "price-low" | "price-high" | "rating" | "newest">("trending")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [assetSearchQuery, setAssetSearchQuery] = useState("")
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isTabSwitching, setIsTabSwitching] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [itemsAnimated, setItemsAnimated] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)

  // Fetch agents from Go backend prompt templates
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true)
      try {
        const response = await fetch('/api/go/prompt-templates')
        
        if (!response.ok) {
          throw new Error('Failed to fetch prompt templates')
        }
        
        const data = await response.json()
        
        // Map template names to agent images (0-9)
        const templateImageMap: Record<string, number> = {
          'default': 0,
          'nof1': 1,
          'taro_long_prompts': 2,
          'Hansen': 3,
        }
        
        // Map pricing based on template complexity (you can adjust these)
        const templatePriceMap: Record<string, number> = {
          'default': 99,
          'nof1': 149,
          'taro_long_prompts': 199,
          'Hansen': 249,
        }
        
        // Map tags based on template
        const templateTagsMap: Record<string, string[]> = {
          'default': ['Balanced', 'All Markets', 'Beginner-Friendly'],
          'nof1': ['Advanced', 'High-Frequency', 'ML'],
          'taro_long_prompts': ['Long-term', 'Risk Management', 'AI'],
          'Hansen': ['Swing Trading', 'Multi-timeframe', 'Expert'],
        }
        
        // Transform templates to agents with CONSISTENT values
        const dynamicAgents: Agent[] = data.templates?.map((t: { name: string }, index: number) => ({
          id: t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: t.name.split('_').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: `Advanced AI trading strategy powered by ${t.name} prompt template with optimized risk management`,
          price: templatePriceMap[t.name] || 149,
          rating: (45 + getConsistentValue(t.name, 0, 4)) / 10, // Consistent 4.5-4.9 rating
          users: getConsistentValue(t.name, 500, 2500), // Consistent 500-2500 users
          icon: `/images/agents/${templateImageMap[t.name] ?? (index % 10)}.png`,
          category: 'Trading Bot',
          tags: templateTagsMap[t.name] || ['AI Trading', 'Automated', 'Smart'],
        })) || []
        
        // Combine dynamic and static agents
        const allAgents = [...dynamicAgents, ...STATIC_AGENTS]
        setAgents(allAgents)
        console.log('✅ Fetched agents - Dynamic:', dynamicAgents.length, 'Static:', STATIC_AGENTS.length, 'Total:', allAgents.length)
      } catch (err) {
        console.error('❌ Failed to fetch agents:', err)
        // Fallback to static agents only if API fails
        setAgents(STATIC_AGENTS)
        console.log('⚠️ Using fallback static agents:', STATIC_AGENTS.length)
      } finally {
        setIsLoadingAgents(false)
      }
    }
    
    fetchAgents()
  }, [])

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => {
      setIsPageLoaded(true)
      setItemsAnimated(true)
    }, 50)
  }, [])

  // Handle tab switching with animation
  const handleTabSwitch = (tab: "agents" | "positions") => {
    if (tab === activeTab) return

    setIsTabSwitching(true)
    setItemsAnimated(false)

    setTimeout(() => {
      setActiveTab(tab)
      setIsTabSwitching(false)
      setTimeout(() => {
        setItemsAnimated(true)
      }, 50)
    }, 300)
  }

  // Handle item click with animation
  const handleItemClick = (href: string) => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(href)
    }, 400)
  }

  // Asset options
  const cryptoAssets = [
    { id: "BTC", name: "Bitcoin", symbol: "₿" },
    { id: "ETH", name: "Ethereum", symbol: "Ξ" },
    { id: "SOL", name: "Solana", symbol: "◎" },
    { id: "MATIC", name: "Polygon", symbol: "⬡" },
    { id: "BNB", name: "BNB", symbol: "⬡" },
    { id: "ADA", name: "Cardano", symbol: "₳" },
    { id: "DOT", name: "Polkadot", symbol: "●" },
    { id: "AVAX", name: "Avalanche", symbol: "▲" },
    { id: "LINK", name: "Chainlink", symbol: "⬢" },
    { id: "UNI", name: "Uniswap", symbol: "🦄" },
  ]

  const stockAssets = [
    { id: "AAPL", name: "Apple Inc.", symbol: "AAPL", disabled: true },
    { id: "GOOGL", name: "Alphabet Inc.", symbol: "GOOGL", disabled: true },
    { id: "MSFT", name: "Microsoft Corp.", symbol: "MSFT", disabled: true },
    { id: "TSLA", name: "Tesla Inc.", symbol: "TSLA", disabled: true },
    { id: "NVDA", name: "NVIDIA Corp.", symbol: "NVDA", disabled: true },
    { id: "META", name: "Meta Platforms", symbol: "META", disabled: true },
    { id: "AMZN", name: "Amazon.com Inc.", symbol: "AMZN", disabled: true },
    { id: "JPM", name: "JPMorgan Chase", symbol: "JPM", disabled: true },
  ]

  const positions: Position[] = [
    {
      id: "btc-long-10x",
      name: "BTC Long 10x",
      description: "Bitcoin long position with 10x leverage, optimized entry and risk management",
      price: 99,
      rating: 4.9,
      users: 2341,
      icon: "₿",
      entryPrice: "$43,250",
      liquidation: "$38,925",
      leverage: "10x",
      type: "Long",
      reason: "BTC broke through key resistance at $42.8K with strong volume.",
      targetPrice: "$52,000",
      riskReward: "3.2:1",
      chartData: [20, 25, 22, 30, 28, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70],
      priceChange: "+12.7%",
      duration: "7-14 days",
      saleType: "auction",
      asset: "BTC",
      currentBid: 85,
      minBid: 50,
      auctionEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      totalBids: 23
    },
    {
      id: "eth-short-5x",
      name: "ETH Short 5x",
      description: "Ethereum short position with 5x leverage, strategic resistance level entry",
      price: 89,
      rating: 4.7,
      users: 1567,
      icon: "⟠",
      entryPrice: "$2,380",
      liquidation: "$2,856",
      leverage: "5x",
      type: "Short",
      reason: "ETH facing strong resistance at $2.4K level.",
      targetPrice: "$2,100",
      riskReward: "2.8:1",
      chartData: [70, 65, 68, 60, 62, 58, 55, 52, 50, 48, 45, 42, 40, 38, 35, 30],
      priceChange: "-8.9%",
      duration: "3-7 days",
      saleType: "fixed",
      asset: "ETH"
    },
    {
      id: "sol-long-20x",
      name: "SOL Long 20x",
      description: "Solana long position with 20x leverage, high-risk high-reward breakout play",
      price: 129,
      rating: 4.8,
      users: 1892,
      icon: "◎",
      entryPrice: "$98.50",
      liquidation: "$93.58",
      leverage: "20x",
      type: "Long",
      reason: "SOL forming ascending triangle pattern with breakout imminent.",
      targetPrice: "$135",
      riskReward: "4.5:1",
      chartData: [15, 18, 20, 25, 30, 28, 35, 40, 38, 45, 50, 55, 60, 65, 70, 80],
      priceChange: "+15.6%",
      duration: "5-10 days",
      saleType: "auction",
      asset: "SOL",
      currentBid: 115,
      minBid: 80,
      auctionEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      totalBids: 47
    },
    {
      id: "matic-long-15x",
      name: "MATIC Long 15x",
      description: "Polygon long position with 15x leverage, momentum-based entry strategy",
      price: 109,
      rating: 4.6,
      users: 1234,
      icon: "⬡",
      entryPrice: "$0.852",
      liquidation: "$0.795",
      leverage: "15x",
      type: "Long",
      reason: "MATIC zkEVM upgrade driving adoption.",
      targetPrice: "$1.15",
      riskReward: "3.8:1",
      chartData: [25, 28, 30, 35, 32, 38, 40, 45, 50, 48, 55, 58, 60, 65, 68, 70],
      priceChange: "+9.4%",
      duration: "10-21 days",
      saleType: "fixed",
      asset: "MATIC"
    }
  ]

  // Filter and sort items
  const getFilteredItems = () => {
    let items: (Agent | Position)[] = []

    if (activeTab === "agents") {
      items = agents
    } else {
      items = positions
    }

    // Apply sale type filter for positions
    if (saleTypeFilter !== "all" && activeTab !== "agents") {
      items = items.filter(item => {
        if ('saleType' in item) {
          return item.saleType === saleTypeFilter
        }
        return true
      })
    }

    // Apply asset filter for positions
    if (assetFilter.length > 0 && activeTab !== "agents") {
      items = items.filter(item => {
        if ('asset' in item) {
          return assetFilter.includes(item.asset)
        }
        return true
      })
    }

    // Apply search filter
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    items.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "trending":
          return b.users - a.users
        default:
          return 0
      }
    })

    return items
  }

  const filteredItems = getFilteredItems()

  // PNL chart component for position previews
  const PNLChart = ({ position }: { position: Position }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (!chartContainerRef.current) return

      const entryPrice = parseFloat(position.entryPrice.replace(/[$,]/g, ''))
      const targetPrice = parseFloat(position.targetPrice.replace(/[$,]/g, ''))
      const leverage = parseFloat(position.leverage.replace(/[x]/g, ''))
      const isLong = position.type === "Long"

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#64748b',
        },
        width: chartContainerRef.current.clientWidth,
        height: 80,
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        rightPriceScale: {
          visible: false,
        },
        timeScale: {
          visible: false,
        },
        crosshair: {
          vertLine: { visible: false },
          horzLine: { visible: false },
        },
      })

      const now = Math.floor(Date.now() / 1000)
      const dataPoints = 30
      const pnlData: { time: Time; value: number }[] = []

      for (let i = 0; i < dataPoints; i++) {
        const progress = i / (dataPoints - 1)
        const time = (now - (dataPoints - i) * 3600) as Time
        const targetMovement = isLong ? targetPrice : entryPrice * 0.9
        const basePrice = entryPrice + (targetMovement - entryPrice) * progress
        const wave = Math.sin(progress * Math.PI * 4) * (entryPrice * 0.005)
        const currentPrice = basePrice + wave
        const pnlPercent = isLong
          ? ((currentPrice - entryPrice) / entryPrice) * 100 * leverage
          : ((entryPrice - currentPrice) / entryPrice) * 100 * leverage
        pnlData.push({ time, value: pnlPercent })
      }

      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: isLong ? '#10b981' : '#ef4444',
        topColor: isLong ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        bottomColor: 'rgba(16, 185, 129, 0.0)',
        lineWidth: 2,
        priceLineVisible: false,
      })

      areaSeries.setData(pnlData)
      chart.timeScale().fitContent()

      return () => chart.remove()
    }, [position])

    return <div ref={chartContainerRef} style={{ width: '100%', height: '80px' }} />
  }

  return (
    <div className={`min-h-screen bg-black pb-20 md:pb-0 transition-all duration-700 ${isPageLoaded && !isNavigating ? 'opacity-100' : 'opacity-0'
      }`}>
      {/* Sticky Header */}
      <MarketplaceHeader locale={locale} activeTab="marketplace" />

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 transition-all duration-700 delay-200 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        {/* Page Introduction */}
        <div className="text-center mb-6">
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-4 tracking-tight transition-all duration-700 delay-300 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
            }`}>
            {tSection('title')} <span className="font-semibold instrument">{tSection('titleHighlight')}</span>
          </h1>

          {/* Type Filter - At Top */}
          <div className={`mb-6 flex items-center justify-center transition-all duration-700 delay-400 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
            <div className="inline-flex items-center rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm p-1 shadow-lg">
              <button
                onClick={() => handleTabSwitch("agents")}
                disabled={isTabSwitching}
                className={`px-4 md:px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${activeTab === "agents" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"
                  } ${isTabSwitching ? 'opacity-50 cursor-wait' : ''}`}
              >
                {tSection('tabAgents')}
              </button>
              <button
                onClick={() => handleTabSwitch("positions")}
                disabled={isTabSwitching}
                className={`px-4 md:px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${activeTab === "positions" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"
                  } ${isTabSwitching ? 'opacity-50 cursor-wait' : ''}`}
              >
                {tSection('tabPositions')}
              </button>
            </div>
          </div>

          {/* Dynamic Merged Description */}
          <div className={`max-w-2xl mx-auto px-4 transition-all duration-700 delay-450 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
            <div className={`transition-all duration-300 ${isTabSwitching ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              {activeTab === "agents" ? (
                <p className="text-xs md:text-sm text-white/60">
                  {t('agentsDescription')}
                </p>
              ) : (
                <p className="text-xs md:text-sm text-white/60">
                  {t('positionsDescription')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className={`rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl transition-all duration-700 delay-500 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
          }`}>

          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "agents" ? t('searchAgentsPlaceholder') : t('searchPositionsPlaceholder')}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide">

                {/* Sale Type Filter (only for positions) */}
                {activeTab !== "agents" && (
                  <div className="inline-flex items-center rounded-full bg-white/[0.03] border border-white/[0.08] p-0.5 flex-shrink-0">
                    <button
                      onClick={() => setSaleTypeFilter("all")}
                      className={`px-2.5 md:px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${saleTypeFilter === "all" ? "bg-purple-600 text-white shadow-lg" : "text-white/60 hover:text-white"
                        }`}
                    >
                      {t('all')}
                    </button>
                    <button
                      onClick={() => setSaleTypeFilter("fixed")}
                      className={`px-2.5 md:px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${saleTypeFilter === "fixed" ? "bg-purple-600 text-white shadow-lg" : "text-white/60 hover:text-white"
                        }`}
                    >
                      {t('fixedPrice')}
                    </button>
                    <button
                      onClick={() => setSaleTypeFilter("auction")}
                      className={`px-2.5 md:px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${saleTypeFilter === "auction" ? "bg-purple-600 text-white shadow-lg" : "text-white/60 hover:text-white"
                        }`}
                    >
                      🔨 {t('auction')}
                    </button>
                  </div>
                )}

                {/* Asset Filter (only for positions) */}
                {activeTab !== "agents" && (
                  <button
                    onClick={() => setIsAssetModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white/60 hover:bg-white/[0.05] hover:text-white transition-all flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="whitespace-nowrap">
                      {assetFilter.length === 0
                        ? t('allAssets')
                        : assetFilter.length === 1
                          ? assetFilter[0]
                          : `${assetFilter.length} ${t('assets')}`}
                    </span>
                    {assetFilter.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setAssetFilter([])
                        }}
                        className="ml-1 hover:bg-black/20 rounded-full p-0.5 cursor-pointer"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Sort and View Mode */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 md:flex-none px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-medium text-white/60 hover:border-white/20 hover:text-white transition-all outline-none cursor-pointer bg-white/[0.03]"
                >
                  <option value="trending" className="bg-black">{t('sortTrending')}</option>
                  <option value="price-low" className="bg-black">{t('sortPriceLow')}</option>
                  <option value="price-high" className="bg-black">{t('sortPriceHigh')}</option>
                  <option value="rating" className="bg-black">{t('sortRating')}</option>
                  <option value="newest" className="bg-black">{t('sortNewest')}</option>
                </select>

                {/* View Mode Toggle */}
                <div className="inline-flex items-center rounded-lg bg-white/[0.03] border border-white/[0.08] p-0.5 flex-shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded transition-all duration-300 ${viewMode === "grid" ? "bg-white text-black" : "text-white/60 hover:text-white"
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 3H3v7h7V3zM21 3h-7v7h7V3zM21 14h-7v7h7v-7zM10 14H3v7h7v-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded transition-all duration-300 ${viewMode === "list" ? "bg-white text-black" : "text-white/60 hover:text-white"
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-5 text-xs text-white/40 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            Showing <span className="font-medium text-white">{filteredItems.length}</span> results
          </div>

          {/* Loading State */}
          {isLoadingAgents && activeTab === "agents" ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white/60 rounded-full animate-spin"></div>
                <p className="text-white/60 text-sm">Loading agents...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Items Grid/List */}
              <div className={`${viewMode === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
                : "space-y-3 md:space-y-4"
                } transition-all duration-300 ${isTabSwitching || isNavigating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {filteredItems.map((item, index) => {
              const isPosition = 'entryPrice' in item
              const position = item as Position
              const href = isPosition ? `/${locale}/position/${item.id}` : `/${locale}/marketplace/agent/${item.id}`

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(href)}
                  className={`group block rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500 hover:-translate-y-0.5 active:scale-95 cursor-pointer overflow-hidden relative ${viewMode === "list" ? "p-4" : "p-4"
                    }`}
                  style={{
                    animation: itemsAnimated ? `fadeInUp 0.6s ease-out forwards ${index * 0.08}s` : 'none',
                    opacity: itemsAnimated ? 1 : 0
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                  <div className={`relative z-10 ${viewMode === "list" ? "flex items-center gap-4" : ""}`}>
                    {/* Icon */}
                    <div className={viewMode === "list" ? "flex-shrink-0" : "mb-3"}>
                      {item.icon.includes('.png') ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm flex items-center justify-center border border-white/[0.08] group-hover:scale-110 transition-transform duration-300">
                          <Image
                            src={item.icon}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm flex items-center justify-center border border-white/[0.08] text-3xl group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Title and badges */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-1.5">{item.name}</h3>
                          <div className="flex items-center gap-1.5">
                            {isPosition && (
                              <>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${position.type === 'Long'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                  {position.leverage} {position.type}
                                </span>
                                {position.saleType === "auction" && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border border-purple-500/30">
                                    🔨 Auction
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-yellow-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-semibold text-white">{item.rating}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white/50 mb-3 line-clamp-2">{item.description}</p>

                      {/* Position Chart or Agent Tags */}
                      {isPosition ? (
                        <div className="mb-3">
                          {viewMode === "grid" && (
                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-1.5 mb-2">
                              <PNLChart position={position} />
                            </div>
                          )}
                          <div className={`text-lg font-bold tabular-nums ${position.priceChange.startsWith('+') ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {position.priceChange}
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">{t('currentPNL')}</div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(item as Agent).tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/[0.05] text-white/60 border border-white/[0.08]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Price and Users */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <div>
                          {isPosition && position.saleType === "auction" ? (
                            <>
                              <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider font-semibold">{t('currentBid')}</div>
                              <div className="text-base font-bold text-white tabular-nums">${position.currentBid}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider font-semibold">Price</div>
                              <div className="text-base font-bold text-white tabular-nums">${item.price}</div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-white/50">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-xs tabular-nums">{item.users.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
              </div>

              {/* Empty State */}
              {filteredItems.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-medium text-white mb-2">{t('noResults').replace('{type}', activeTab === "agents" ? t('agents') : t('positions'))}</h3>
                  <p className="text-white/60 mb-6">{t('tryAdjusting')}</p>
                  <button
                    onClick={() => {
                      setActiveTab("agents")
                      setSaleTypeFilter("all")
                      setAssetFilter([])
                      setSearchQuery("")
                    }}
                    className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Asset Filter Modal */}
      {isAssetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setIsAssetModalOpen(false)
            setAssetSearchQuery("")
          }}
        >
          <div
            className="bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Filter by Asset</h3>
                  {assetFilter.length > 0 && (
                    <p className="text-xs text-white/50 mt-1">
                      {assetFilter.length} {assetFilter.length === 1 ? 'asset' : 'assets'} selected
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsAssetModalOpen(false)
                    setAssetSearchQuery("")
                  }}
                  className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-9 pr-10 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white placeholder-white/30 text-xs focus:border-white/20 transition-all outline-none"
                  autoFocus
                />
                {assetSearchQuery && (
                  <button
                    onClick={() => setAssetSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/[0.05] rounded transition-all"
                  >
                    <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* Clear All Button */}
              {assetFilter.length > 0 && (
                <button
                  onClick={() => setAssetFilter([])}
                  className="w-full mb-4 p-2.5 rounded-lg border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03] transition-all text-center text-xs font-medium text-white/60"
                >
                  Clear All ({assetFilter.length})
                </button>
              )}

              {/* Crypto Assets */}
              {(() => {
                const filteredCrypto = cryptoAssets.filter(asset =>
                  !assetSearchQuery ||
                  asset.id.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                  asset.name.toLowerCase().includes(assetSearchQuery.toLowerCase())
                )

                if (filteredCrypto.length === 0) return null

                return (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                        <span>Cryptocurrency</span>
                        <span className="text-[10px] text-white/30 font-normal">({filteredCrypto.length})</span>
                      </h4>
                      {filteredCrypto.some(a => assetFilter.includes(a.id)) && (
                        <button
                          onClick={() => {
                            setAssetFilter(assetFilter.filter(id => !filteredCrypto.some(a => a.id === id)))
                          }}
                          className="text-[10px] text-white/50 hover:text-white font-medium"
                        >
                          Deselect All
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {filteredCrypto.map((asset) => {
                        const isSelected = assetFilter.includes(asset.id)
                        return (
                          <button
                            key={asset.id}
                            onClick={() => {
                              if (isSelected) {
                                setAssetFilter(assetFilter.filter(id => id !== asset.id))
                              } else {
                                setAssetFilter([...assetFilter, asset.id])
                              }
                            }}
                            className={`p-3 rounded-lg border transition-all text-left relative ${isSelected
                              ? "border-white/20 bg-white/[0.08]"
                              : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <span className="text-xl">{asset.symbol}</span>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-xs text-white">{asset.id}</div>
                                <div className="text-[10px] text-white/50">
                                  {asset.name}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Stock Assets */}
              {(() => {
                const filteredStocks = stockAssets.filter(asset =>
                  !assetSearchQuery ||
                  asset.id.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                  asset.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                  asset.symbol.toLowerCase().includes(assetSearchQuery.toLowerCase())
                )

                if (filteredStocks.length === 0) return null

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                        <span>Stocks</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] normal-case font-normal bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Coming Soon
                        </span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {filteredStocks.map((asset) => (
                        <button
                          key={asset.id}
                          disabled={asset.disabled}
                          className="p-3 rounded-lg border border-white/[0.06] text-left opacity-30 cursor-not-allowed"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-white/[0.03] flex items-center justify-center text-[10px] font-bold text-white/40">
                              {asset.symbol.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-xs text-white/50">{asset.symbol}</div>
                              <div className="text-[10px] text-white/30">{asset.name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* No Results */}
              {assetSearchQuery &&
                cryptoAssets.filter(a =>
                  a.id.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                  a.name.toLowerCase().includes(assetSearchQuery.toLowerCase())
                ).length === 0 &&
                stockAssets.filter(a =>
                  a.id.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                  a.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                  a.symbol.toLowerCase().includes(assetSearchQuery.toLowerCase())
                ).length === 0 &&
                !"all assets".includes(assetSearchQuery.toLowerCase()) && (
                  <div className="text-center py-10">
                    <div className="text-3xl mb-2">🔍</div>
                    <h4 className="text-sm font-medium text-white mb-1.5">No assets found</h4>
                    <p className="text-xs text-white/50">
                      Try searching with a different term
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setAssetFilter([])
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/[0.08] text-white/70 font-medium text-xs hover:bg-white/[0.03] hover:text-white transition-all"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    setIsAssetModalOpen(false)
                    setAssetSearchQuery("")
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/[0.08] text-white font-semibold text-xs hover:bg-white/[0.12] transition-all"
                >
                  Apply {assetFilter.length > 0 && `(${assetFilter.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* AI Trading Tutor */}
      <PulsingCircle />
    </div>
  )
}

