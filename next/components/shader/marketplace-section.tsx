"use client"

import { useState, useEffect, useRef } from "react"
import { createChart, ColorType, LineStyle, AreaSeries, type Time } from 'lightweight-charts'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

type Agent = {
  name: string
  description: string
  price: number
  rating: number
  users: number
  icon: string
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
  // Auction fields
  currentBid?: number
  minBid?: number
  auctionEndTime?: Date
  totalBids?: number
}

export default function MarketplaceSection() {
  const t = useTranslations('marketplaceSection')
  const [activeTab, setActiveTab] = useState<"agents" | "positions">("agents")
  const [isNavigating, setIsNavigating] = useState(false)
  const params = useParams()
  const router = useRouter()
  const locale = params?.locale as string || 'en'

  const agents: Agent[] = [
    {
      name: "Momentum Master",
      description: "High-frequency trading strategy using advanced momentum indicators and machine learning",
      price: 299,
      rating: 4.8,
      users: 1243,
      icon: "/images/agents/2.png"
    },
    {
      name: "Volatility Hunter",
      description: "Capitalize on market volatility with AI-powered risk management and dynamic position sizing",
      price: 199,
      rating: 4.6,
      users: 892,
      icon: "/images/agents/5.png"
    },
    {
      name: "DCA Smart Bot",
      description: "Dollar-cost averaging strategy optimized by AI for maximum long-term gains",
      price: 149,
      rating: 4.9,
      users: 2156,
      icon: "/images/agents/7.png"
    },
    {
      name: "Swing Trader Pro",
      description: "Multi-timeframe swing trading with AI sentiment analysis and technical indicators",
      price: 249,
      rating: 4.7,
      users: 1087,
      icon: "/images/agents/3.png"
    }
  ]

  const positions: Position[] = [
    {
      id: "btc-long-10x",
      name: "BTC Long 10x",
      description: "Bitcoin long position with 10x leverage, optimized entry and risk management",
      price: 99,
      rating: 4.9,
      users: 2341,
      icon: "/svg/color/btc.svg",
      entryPrice: "$43,250",
      liquidation: "$38,925",
      leverage: "10x",
      type: "Long",
      reason: "BTC broke through key resistance at $42.8K with strong volume. RSI showing bullish divergence on 4H chart. On-chain metrics indicate accumulation by whales. Historical support at $41K provides solid floor. ETF inflows reached $500M this week.",
      targetPrice: "$52,000",
      riskReward: "3.2:1",
      chartData: [20, 25, 22, 30, 28, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70],
      priceChange: "+12.7%",
      duration: "7-14 days",
      saleType: "auction",
      currentBid: 85,
      minBid: 50,
      auctionEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      totalBids: 23
    },
    {
      id: "eth-short-5x",
      name: "ETH Short 5x",
      description: "Ethereum short position with 5x leverage, strategic resistance level entry",
      price: 89,
      rating: 4.7,
      users: 1567,
      icon: "/svg/color/eth.svg",
      entryPrice: "$2,380",
      liquidation: "$2,856",
      leverage: "5x",
      type: "Short",
      reason: "ETH facing strong resistance at $2.4K level. RSI overbought on daily timeframe. Declining network activity and gas fees suggest weakening demand. Shanghai upgrade selling pressure expected. BTC correlation weakening.",
      targetPrice: "$2,100",
      riskReward: "2.8:1",
      chartData: [70, 65, 68, 60, 62, 58, 55, 52, 50, 48, 45, 42, 40, 38, 35, 30],
      priceChange: "-8.9%",
      duration: "3-7 days",
      saleType: "fixed"
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
      reason: "SOL forming ascending triangle pattern with breakout imminent. Network TVL up 45% this month. Major partnership announcements expected. DeFi ecosystem expanding rapidly. Technical indicators showing strong momentum with MACD golden cross.",
      targetPrice: "$135",
      riskReward: "4.5:1",
      chartData: [15, 18, 20, 25, 30, 28, 35, 40, 38, 45, 50, 55, 60, 65, 70, 80],
      priceChange: "+15.6%",
      duration: "5-10 days",
      saleType: "auction",
      currentBid: 115,
      minBid: 80,
      auctionEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      totalBids: 47
    },
    {
      id: "matic-long-15x",
      name: "MATIC Long 15x",
      description: "Polygon long position with 15x leverage, momentum-based entry strategy",
      price: 109,
      rating: 4.6,
      users: 1234,
      icon: "/svg/color/poly.svg",
      entryPrice: "$0.852",
      liquidation: "$0.795",
      leverage: "15x",
      type: "Long",
      reason: "MATIC zkEVM upgrade driving adoption. Transaction volume hitting ATH. Major gaming partnerships announced. Strong support at $0.82 level. Relative strength vs BTC improving. Bollinger Bands showing volatility squeeze.",
      targetPrice: "$1.15",
      riskReward: "3.8:1",
      chartData: [25, 28, 30, 35, 32, 38, 40, 45, 50, 48, 55, 58, 60, 65, 68, 70],
      priceChange: "+9.4%",
      duration: "10-21 days",
      saleType: "fixed"
    }
  ]

  const items: (Agent | Position)[] = activeTab === "agents" ? agents : positions

  // Handle navigation with animation
  const handleViewAll = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(`/${locale}/marketplace`)
    }, 500) // Match animation duration
  }

  // PNL chart component - shows profit/loss over time
  const PNLChart = ({ position, fullWidth = false, showReferenceLines = true }: { position: Position, fullWidth?: boolean, showReferenceLines?: boolean }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (!chartContainerRef.current) return

      // Parse prices
      const entryPrice = parseFloat(position.entryPrice.replace(/[$,]/g, ''))
      const targetPrice = parseFloat(position.targetPrice.replace(/[$,]/g, ''))
      const liquidation = parseFloat(position.liquidation.replace(/[$,]/g, ''))
      const leverage = parseFloat(position.leverage.replace(/[x]/g, ''))
      const isLong = position.type === "Long"

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#64748b',
        },
        width: chartContainerRef.current.clientWidth,
        height: fullWidth ? 160 : 120,
        grid: {
          vertLines: { color: 'rgba(0,0,0,0.05)' },
          horzLines: { color: 'rgba(0,0,0,0.05)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(0,0,0,0.1)',
        },
        timeScale: {
          borderColor: 'rgba(0,0,0,0.1)',
          visible: false,
        },
        crosshair: {
          vertLine: { color: 'rgba(0,0,0,0.2)', labelVisible: false },
          horzLine: { color: 'rgba(0,0,0,0.2)', labelVisible: true },
        },
      })

      // Generate realistic price data and calculate PNL
      const now = Math.floor(Date.now() / 1000)
      const dataPoints = 50
      const pnlData: { time: Time; value: number }[] = []

      for (let i = 0; i < dataPoints; i++) {
        const progress = i / (dataPoints - 1)
        const time = (now - (dataPoints - i) * 3600) as Time // Hourly data

        // Generate realistic price movement
        const targetMovement = isLong ? targetPrice : liquidation
        const basePrice = entryPrice + (targetMovement - entryPrice) * progress

        // Add volatility
        const wave1 = Math.sin(progress * Math.PI * 4) * (entryPrice * 0.005)
        const wave2 = Math.sin(progress * Math.PI * 8) * (entryPrice * 0.003)
        const randomNoise = (Math.random() - 0.5) * (entryPrice * 0.002)

        const currentPrice = basePrice + wave1 + wave2 + randomNoise

        // Calculate PNL%
        let pnlPercent: number
        if (isLong) {
          pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * leverage
        } else {
          pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100 * leverage
        }

        pnlData.push({ time, value: pnlPercent })
      }

      // Create area series for PNL
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: isLong ? '#10b981' : '#ef4444',
        topColor: isLong ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        bottomColor: isLong ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)',
        lineWidth: 2,
        priceLineVisible: false,
      })

      areaSeries.setData(pnlData)

      // Add reference lines only if showReferenceLines is true
      if (showReferenceLines) {
        // Add zero line
        areaSeries.createPriceLine({
          price: 0,
          color: '#64748b',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'Break Even',
        })

        // Calculate target PNL
        const targetPnl = isLong
          ? ((targetPrice - entryPrice) / entryPrice) * 100 * leverage
          : ((entryPrice - targetPrice) / entryPrice) * 100 * leverage

        // Add target PNL line
        areaSeries.createPriceLine({
          price: targetPnl,
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Target',
        })

        // Calculate liquidation PNL (-100%)
        areaSeries.createPriceLine({
          price: -100,
          color: '#dc2626',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Liq',
        })
      }

      // Fit content
      chart.timeScale().fitContent()

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    }, [position, fullWidth, showReferenceLines])

    return (
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: fullWidth ? '160px' : '120px' }}
      />
    )
  }

  return (
    <section id="strategies" className="relative z-20 px-6 md:px-8 py-20 md:py-28 bg-black">
      {/* Ambient light effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Card Container */}
      <div
        className={`relative max-w-7xl mx-auto rounded-3xl border-2 border-white/10 bg-white p-8 md:p-12 shadow-[0_20px_60px_0_rgba(0,0,0,0.5)] transition-all duration-500 ${isNavigating ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'
          }`}
      >
        {/* Glass shine effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

        {/* Section Header */}
        <div className="relative text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light text-black mb-4 tracking-tight">
            {t('title')}{" "}
            <span className="font-medium italic instrument">{t('titleHighlight')}</span>
          </h2>
          <p className="text-sm font-light text-black/60 max-w-2xl mx-auto leading-relaxed mb-8">
            {t('subtitle')}
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex items-center rounded-full bg-black/5 border border-black/10 p-1">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "agents"
                ? "bg-black text-white shadow-lg"
                : "text-black/60 hover:text-black"
                }`}
            >
              {t('tabAgents')}
            </button>
            <button
              onClick={() => setActiveTab("positions")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "positions"
                ? "bg-black text-white shadow-lg"
                : "text-black/60 hover:text-black"
                }`}
            >
              {t('tabPositions')}
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {items.map((item, index) => (
            <div
              key={item.name}
              className="group relative"
              style={{
                animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`,
                opacity: 0
              }}
            >
              {/* Card */}
              <div className="relative h-full">
                <div className="relative h-full p-6 rounded-2xl bg-black/[0.02] backdrop-blur-xl border border-black/10 hover:bg-black/[0.04] hover:border-black/20 transition-all duration-500 shadow-[0_4px_16px_0_rgba(0,0,0,0.08)] flex flex-col overflow-hidden group-hover:-translate-y-1">
                  {/* Glass shine effect */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-5">
                      {item.icon.includes('.png') || item.icon.includes('.svg') ? (
                        <div className={`w-14 h-14 ${item.icon.includes('.png') ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-gradient-to-br from-black/10 to-black/5 backdrop-blur-sm flex items-center justify-center border border-black/10 group-hover:scale-110 transition-transform duration-300`}>
                          <Image
                            src={item.icon}
                            alt={item.name}
                            width={56}
                            height={56}
                            className={`${item.icon.includes('.svg') ? 'w-10 h-10' : 'w-full h-full'} object-cover`}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-black/10 to-black/5 backdrop-blur-sm flex items-center justify-center border border-black/10 text-3xl group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-medium text-black mb-3 tracking-tight">
                      {item.name}
                    </h3>

                    {/* Description - only for agents */}
                    {'entryPrice' in item ? null : (
                      <p className="text-xs font-light text-black/70 leading-relaxed mb-6 flex-1">
                        {item.description}
                      </p>
                    )}

                    {/* Stats or Position Info */}
                    {'entryPrice' in item ? (
                      // Position-specific info with chart
                      <div className="mb-6 flex-1 flex flex-col justify-center">
                        {/* Leverage Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(item as Position).type === 'Long' ? 'bg-green-500/20 text-green-600 border border-green-500/30' : 'bg-red-500/20 text-red-600 border border-red-500/30'
                            }`}>
                            {(item as Position).leverage} {(item as Position).type}
                          </span>
                          {(item as Position).saleType === "auction" && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-600 border border-purple-500/30">
                              🔨 {t('auction')}
                            </span>
                          )}
                        </div>

                        {/* PNL Number */}
                        <div className="mb-3 text-center">
                          <div className={`text-3xl font-semibold ${(item as Position).priceChange.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {(item as Position).priceChange}
                          </div>
                          <div className="text-xs text-black/40 mt-1">{t('currentPNL')}</div>
                        </div>

                        {/* Chart Visualization */}
                        <div className="relative p-3 rounded-xl bg-black/[0.02] border border-black/10">
                          <PNLChart position={item as Position} showReferenceLines={false} />
                        </div>
                      </div>
                    ) : (
                      // Agent stats
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-black/10">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-black/70">{item.rating}</span>
                        </div>
                        <span className="text-black/30">•</span>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-sm font-medium text-black/60">{item.users.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Pricing / Info */}
                    {'entryPrice' in item ? (
                      // Position info (clickable - navigates to detail page)
                      <Link
                        href={`/${locale}/position/${(item as Position).id}`}
                        className="block space-y-3 pt-6 border-t border-black/10 hover:opacity-70 transition-opacity"
                      >
                        {(item as Position).saleType === "fixed" ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-black/50 mb-1">{t('fixedPrice')}</div>
                              <span className="text-2xl font-medium text-black tracking-tight">${item.price}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-black/60">
                              <span>{t('viewDetails')}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-black/50 mb-1">{t('currentBid')}</div>
                                <span className="text-2xl font-medium text-black tracking-tight">${(item as Position).currentBid}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-black/60">
                                <span>{t('viewDetails')}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-black/50">
                              <span>{(item as Position).totalBids} {t('bids')}</span>
                              <span>{t('endsIn')} {Math.floor(((item as Position).auctionEndTime!.getTime() - Date.now()) / (1000 * 60 * 60))}h</span>
                            </div>
                          </div>
                        )}
                      </Link>
                    ) : (
                      // Agent button
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-medium text-black tracking-tight">${item.price}</span>
                        </div>
                        <button className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium transition-all duration-200 hover:bg-black/90 active:scale-95">
                          {t('get')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <button
            onClick={handleViewAll}
            disabled={isNavigating}
            className={`relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium transition-all duration-300 shadow-lg ${isNavigating
              ? 'scale-110 shadow-2xl shadow-black/50'
              : 'hover:bg-black/90 hover:scale-105 active:scale-95'
              }`}
          >
            <span className={`transition-all duration-300 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
              {t('viewAll')}
            </span>

            {/* Loading Spinner */}
            {isNavigating && (
              <svg
                className="absolute w-5 h-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}

            {/* Arrow Icon */}
            {!isNavigating && (
              <svg
                className="w-4 h-4 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

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
    </section>
  )
}
