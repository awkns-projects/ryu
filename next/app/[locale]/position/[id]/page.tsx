"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createChart, ColorType, LineStyle, AreaSeries, type Time } from 'lightweight-charts'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import AppHeader from '@/components/app-header'
import CardShaderBackground from '@/components/shader/card-shader-background'

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
  currentBid?: number
  minBid?: number
  auctionEndTime?: Date
  totalBids?: number
  placedDate: Date
  contractValue: number
  agentName?: string
  agentAvatar?: string
}

const POSITIONS: Record<string, Position> = {
  "btc-long-10x": {
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
    reason: "BTC broke through key resistance at $42.8K with strong volume. RSI showing bullish divergence on 4H chart. On-chain metrics indicate accumulation by whales. Historical support at $41K provides solid floor. ETF inflows reached $500M this week.",
    targetPrice: "$52,000",
    riskReward: "3.2:1",
    chartData: [20, 25, 22, 30, 28, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70],
    priceChange: "+12.7%",
    duration: "7-14 days",
    saleType: "auction",
    currentBid: 85,
    minBid: 50,
    auctionEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    totalBids: 23,
    placedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    contractValue: 432500,
    agentName: "Crypto Momentum Trader",
    agentAvatar: "/images/agents/0.png"
  },
  "eth-short-5x": {
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
    reason: "ETH facing strong resistance at $2.4K level. RSI overbought on daily timeframe. Declining network activity and gas fees suggest weakening demand. Shanghai upgrade selling pressure expected. BTC correlation weakening.",
    targetPrice: "$2,100",
    riskReward: "2.8:1",
    chartData: [70, 65, 68, 60, 62, 58, 55, 52, 50, 48, 45, 42, 40, 38, 35, 30],
    priceChange: "-8.9%",
    duration: "3-7 days",
    saleType: "fixed",
    placedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    contractValue: 11900,
    agentName: "Technical Analysis Pro",
    agentAvatar: "/images/agents/1.png"
  },
  "sol-long-20x": {
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
    auctionEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    totalBids: 47,
    placedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    contractValue: 197000,
    agentName: "DeFi Alpha Hunter",
    agentAvatar: "/images/agents/2.png"
  },
  "matic-long-15x": {
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
    reason: "MATIC zkEVM upgrade driving adoption. Transaction volume hitting ATH. Major gaming partnerships announced. Strong support at $0.82 level. Relative strength vs BTC improving. Bollinger Bands showing volatility squeeze.",
    targetPrice: "$1.15",
    riskReward: "3.8:1",
    chartData: [25, 28, 30, 35, 32, 38, 40, 45, 50, 48, 55, 58, 60, 65, 68, 70],
    priceChange: "+9.4%",
    duration: "10-21 days",
    saleType: "fixed",
    placedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    contractValue: 12780,
    agentName: "Layer 2 Specialist",
    agentAvatar: "/images/agents/3.png"
  }
}

// PNL chart component
const PNLChart = ({ position, fullWidth = false, showReferenceLines = true }: { position: Position, fullWidth?: boolean, showReferenceLines?: boolean }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const entryPrice = parseFloat(position.entryPrice.replace(/[$,]/g, ''))
    const targetPrice = parseFloat(position.targetPrice.replace(/[$,]/g, ''))
    const liquidation = parseFloat(position.liquidation.replace(/[$,]/g, ''))
    const leverage = parseFloat(position.leverage.replace(/[x]/g, ''))
    const isLong = position.type === "Long"

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      width: chartContainerRef.current.clientWidth,
      height: fullWidth ? 300 : 200,
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.05)' },
        horzLines: { color: 'rgba(0,0,0,0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(0,0,0,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(0,0,0,0.1)',
        visible: true,
      },
      crosshair: {
        vertLine: { color: 'rgba(0,0,0,0.2)', labelVisible: false },
        horzLine: { color: 'rgba(0,0,0,0.2)', labelVisible: true },
      },
    })

    const now = Math.floor(Date.now() / 1000)
    const dataPoints = 50
    const pnlData: { time: Time; value: number }[] = []

    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1)
      const time = (now - (dataPoints - i) * 3600) as Time

      const targetMovement = isLong ? targetPrice : liquidation
      const basePrice = entryPrice + (targetMovement - entryPrice) * progress

      const wave1 = Math.sin(progress * Math.PI * 4) * (entryPrice * 0.005)
      const wave2 = Math.sin(progress * Math.PI * 8) * (entryPrice * 0.003)
      const randomNoise = (Math.random() - 0.5) * (entryPrice * 0.002)

      const currentPrice = basePrice + wave1 + wave2 + randomNoise

      let pnlPercent: number
      if (isLong) {
        pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * leverage
      } else {
        pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100 * leverage
      }

      pnlData.push({ time, value: pnlPercent })
    }

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: isLong ? '#10b981' : '#ef4444',
      topColor: isLong ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      bottomColor: isLong ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)',
      lineWidth: 2,
      priceLineVisible: false,
    })

    areaSeries.setData(pnlData)

    if (showReferenceLines) {
      areaSeries.createPriceLine({
        price: 0,
        color: '#64748b',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'Break Even',
      })

      const targetPnl = isLong
        ? ((targetPrice - entryPrice) / entryPrice) * 100 * leverage
        : ((entryPrice - targetPrice) / entryPrice) * 100 * leverage

      areaSeries.createPriceLine({
        price: targetPnl,
        color: '#22c55e',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Target',
      })

      areaSeries.createPriceLine({
        price: -100,
        color: '#dc2626',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Liq',
      })
    }

    chart.timeScale().fitContent()

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
      style={{ width: '100%', height: fullWidth ? '300px' : '200px' }}
    />
  )
}

// Buying Section Component
const BuyingSection = ({
  position,
  bidAmount,
  setBidAmount,
  t,
  isMinimized = false
}: {
  position: Position
  bidAmount: string
  setBidAmount: (val: string) => void
  t: any
  isMinimized?: boolean
}) => {
  if (isMinimized) {
    return (
      <div className="flex items-center gap-3">
        {position.saleType === "fixed" ? (
          <>
            <div className="flex-1">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Fixed Price</div>
              <div className="text-xl font-bold text-white tabular-nums">${position.price}</div>
            </div>
            <button className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-semibold transition-all duration-200 hover:bg-white/90 active:scale-95 shadow-lg whitespace-nowrap">
              Buy Now
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Current Bid</div>
              <div className="text-xl font-bold text-purple-400 tabular-nums">${position.currentBid}</div>
            </div>
            <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold transition-all duration-200 hover:from-purple-700 hover:to-blue-700 active:scale-95 shadow-lg whitespace-nowrap">
              Place Bid
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
      {position.saleType === "fixed" ? (
        // Fixed Price
        <>
          <div className="mb-6">
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Fixed Price
            </div>
            <div className="text-4xl font-bold text-white mb-3 tabular-nums">
              ${position.price}
            </div>
            <div className="text-xs text-white/50">
              One-time purchase for full access to this position
            </div>
          </div>

          <button className="w-full px-6 py-3 rounded-lg bg-white text-black text-sm font-semibold transition-all duration-200 hover:bg-white/90 active:scale-95 shadow-lg mb-4">
            {t('buyNow')} - ${position.price}
          </button>

          <div className="pt-4 border-t border-white/[0.06] space-y-2 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Full strategy details</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Real-time updates</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>24/7 support</span>
            </div>
          </div>
        </>
      ) : (
        // Auction
        <>
          <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔨</span>
              <h3 className="text-base font-semibold text-white">Live Auction</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider font-semibold">Current Bid</div>
                <div className="text-3xl font-bold text-purple-400 tabular-nums">${position.currentBid}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
                <div>
                  <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider font-semibold">Minimum Bid</div>
                  <div className="text-sm font-semibold text-white tabular-nums">${position.minBid}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 mb-0.5 uppercase tracking-wider font-semibold">Total Bids</div>
                  <div className="text-sm font-semibold text-white tabular-nums">{position.totalBids}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.08]">
                <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider font-semibold">Auction Ends</div>
                <div className="text-lg font-semibold text-purple-400 tabular-nums" suppressHydrationWarning>
                  {Math.floor(((position.auctionEndTime!.getTime() - Date.now()) / (1000 * 60 * 60)))}h{' '}
                  {Math.floor((((position.auctionEndTime!.getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)))}m
                </div>
                <div className="text-[10px] text-white/30 mt-1" suppressHydrationWarning>
                  {position.auctionEndTime!.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Bid Input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-white/60 mb-2">
              Your Bid Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-base">$</span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min: ${(position.currentBid || 0) + 1}`}
                className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-base font-semibold text-white placeholder:text-white/30"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-white/40">
              Minimum bid: ${(position.currentBid || 0) + 1}
            </p>
          </div>

          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setBidAmount(String((position.currentBid || 0) + 5))}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.03] hover:text-white transition-all"
            >
              +$5
            </button>
            <button
              onClick={() => setBidAmount(String((position.currentBid || 0) + 10))}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.03] hover:text-white transition-all"
            >
              +$10
            </button>
            <button
              onClick={() => setBidAmount(String((position.currentBid || 0) + 20))}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.03] hover:text-white transition-all"
            >
              +$20
            </button>
          </div>

          {/* Place Bid Button */}
          <button
            onClick={() => {
              const bid = parseFloat(bidAmount)
              if (bid > (position.currentBid || 0)) {
                alert(`Bid of $${bid} placed successfully!`)
                setBidAmount("")
              } else {
                alert(`Bid must be higher than current bid of $${position.currentBid}`)
              }
            }}
            disabled={!bidAmount || parseFloat(bidAmount) <= (position.currentBid || 0)}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold transition-all duration-200 hover:from-purple-700 hover:to-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {t('placeBid')}
          </button>

          <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-white/50">
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Highest bidder wins when auction ends. You&apos;ll only be charged if you win.</span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Position price chart component
const PositionChart = ({ position, fullWidth = false }: { position: Position, fullWidth?: boolean }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const entryPrice = parseFloat(position.entryPrice.replace(/[$,]/g, ''))
    const targetPrice = parseFloat(position.targetPrice.replace(/[$,]/g, ''))
    const liquidation = parseFloat(position.liquidation.replace(/[$,]/g, ''))
    const isLong = position.type === "Long"

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      width: chartContainerRef.current.clientWidth,
      height: fullWidth ? 300 : 200,
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.05)' },
        horzLines: { color: 'rgba(0,0,0,0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(0,0,0,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(0,0,0,0.1)',
        visible: true,
      },
      crosshair: {
        vertLine: { color: 'rgba(0,0,0,0.2)', labelVisible: false },
        horzLine: { color: 'rgba(0,0,0,0.2)', labelVisible: true },
      },
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: isLong ? '#10b981' : '#ef4444',
      topColor: isLong ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      bottomColor: isLong ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)',
      lineWidth: 2,
      priceLineVisible: false,
    })

    const now = Math.floor(Date.now() / 1000)
    const dataPoints = 50
    const data: { time: Time; value: number }[] = []

    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1)
      const time = (now - (dataPoints - i) * 3600) as Time

      const targetMovement = isLong ? targetPrice : liquidation
      const basePrice = entryPrice + (targetMovement - entryPrice) * progress

      const wave1 = Math.sin(progress * Math.PI * 4) * (entryPrice * 0.005)
      const wave2 = Math.sin(progress * Math.PI * 8) * (entryPrice * 0.003)
      const randomNoise = (Math.random() - 0.5) * (entryPrice * 0.002)

      const value = basePrice + wave1 + wave2 + randomNoise

      data.push({ time, value })
    }

    areaSeries.setData(data)

    areaSeries.createPriceLine({
      price: targetPrice,
      color: '#22c55e',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Target',
    })

    areaSeries.createPriceLine({
      price: entryPrice,
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Entry',
    })

    areaSeries.createPriceLine({
      price: liquidation,
      color: '#dc2626',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Liq',
    })

    chart.timeScale().fitContent()

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
  }, [position, fullWidth])

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: fullWidth ? '300px' : '200px' }}
    />
  )
}

export default function PositionPage() {
  const t = useTranslations('positionPage')
  const params = useParams()
  const router = useRouter()
  const [bidAmount, setBidAmount] = useState<string>("")
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showMinimized, setShowMinimized] = useState(false)
  const currentLocale = useLocale()
  const buyingSectionRef = useRef<HTMLDivElement>(null)

  const positionId = params.id as string
  const locale = params.locale as string || 'en'
  const position = POSITIONS[positionId]

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => {
      setIsPageLoaded(true)
    }, 50)
  }, [])

  // Handle scroll for mobile buying section
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) return // Only on mobile

      const buyingSection = buyingSectionRef.current
      if (!buyingSection) return

      const rect = buyingSection.getBoundingClientRect()
      const hasScrolledPast = rect.bottom < window.innerHeight / 2

      setIsScrolled(window.scrollY > 100)
      setShowMinimized(hasScrolledPast)
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  if (!position) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <AppHeader locale={locale} activeTab="marketplace" />

        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 73px)" }}>
          <div className="text-center">
            <h1 className="text-2xl font-medium text-white mb-4">{t('notFound')}</h1>
            <button
              onClick={() => router.push(`/${locale}/marketplace`)}
              className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90"
            >
              {t('goBack')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-black pb-20 md:pb-0 transition-all duration-700 ${isPageLoaded ? 'opacity-100' : 'opacity-0'
      }`}>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-50 bg-black/95 backdrop-blur-xl transition-all duration-700 delay-100 ${isPageLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}>
        <AppHeader locale={locale} activeTab="marketplace" />

        {/* Mobile Sticky Buying Section - Shows when scrolled */}
        <div className={`lg:hidden border-b border-white/[0.08] transition-all duration-300 overflow-hidden ${showMinimized ? 'max-h-[80px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="px-4 py-3">
            <BuyingSection
              position={position}
              bidAmount={bidAmount}
              setBidAmount={setBidAmount}
              t={t}
              isMinimized={true}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 transition-all duration-700 delay-200 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${locale}/marketplace`)}
          className={`flex items-center gap-1.5 text-white/50 hover:text-white transition-all mb-6 group duration-700 delay-300 ${isPageLoaded ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
            }`}
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-medium">{t('backToMarketplace')}</span>
        </button>

        {/* Educational Section */}
        <div className={`text-center mb-6 transition-all duration-700 delay-350 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
          }`}>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-3 tracking-tight">
            {t('pageTitle')} <span className="font-semibold instrument">{t('pageTitleHighlight')}</span>
          </h1>
          <p className="text-xs md:text-sm text-white/60 max-w-2xl mx-auto px-4">
            {t('pageDescription')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          {/* Left Column - Position Details */}
          <div className={`lg:col-span-2 transition-all duration-700 delay-500 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
            }`}>
            <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
              {/* Position Header */}
              <div className="flex items-start gap-4 mb-5">
                {position.icon.includes('.png') ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm flex items-center justify-center border border-white/[0.08]">
                    <Image
                      src={position.icon}
                      alt={position.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm flex items-center justify-center border border-white/[0.08] text-4xl">
                    {position.icon}
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-white mb-2">{position.name}</h1>
                  <p className="text-white/50 text-sm mb-3">{position.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${position.type === 'Long'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                      {position.leverage} {position.type}
                    </span>
                    {position.saleType === "auction" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border border-purple-500/30">
                        🔨 Live Auction
                      </span>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-white tabular-nums">{position.rating}</span>
                      </div>
                      <span className="text-white/20">•</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-white/60 tabular-nums">{position.users.toLocaleString()} users</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current PNL Display */}
              <CardShaderBackground
                className="rounded-lg border border-white/[0.08]"
                agentName={position.agentName}
                agentAvatar={position.agentAvatar}
                showAgentInfo={true}
              >
                <div className="px-6 py-6 text-center">
                  <div className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3">
                    {t('currentPNL')}
                  </div>
                  <div className={`text-5xl font-bold mb-5 tabular-nums tracking-tight ${position.priceChange.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {position.priceChange}
                  </div>
                  <div className="flex items-center justify-center gap-8 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-white/40 text-xs uppercase tracking-wide">Risk/Reward</span>
                      <span className="text-white font-bold tabular-nums text-base">{position.riskReward}</span>
                    </div>
                    <span className="text-white/10 text-2xl">|</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-white/40 text-xs uppercase tracking-wide">Est. Duration</span>
                      <span className="text-white font-bold text-base">{position.duration}</span>
                    </div>
                  </div>
                </div>
              </CardShaderBackground>

              {/* Mobile Buying Section - Shows below shader card on mobile only */}
              <div
                ref={buyingSectionRef}
                className={`lg:hidden mt-5 transition-all duration-700 delay-550 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                  }`}
              >
                <BuyingSection
                  position={position}
                  bidAmount={bidAmount}
                  setBidAmount={setBidAmount}
                  t={t}
                />
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/[0.06]"></div>

              {/* Position Details */}
              <div>
                <h2 className="text-base font-semibold text-white mb-3">Position Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-white/40 text-[10px] mb-1 uppercase tracking-wider font-semibold">Contract Value</span>
                    <span className="text-white font-bold text-lg tabular-nums">${position.contractValue.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-400/70 text-[10px] mb-1 uppercase tracking-wider font-semibold">Amount Spent</span>
                    <span className="text-blue-400 font-bold text-lg tabular-nums">${position.price}</span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-white/40 text-[10px] mb-1 uppercase tracking-wider font-semibold">Placed Date</span>
                    <span className="text-white font-semibold text-sm" suppressHydrationWarning>
                      {position.placedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-white/40 text-[10px] mb-1 uppercase tracking-wider font-semibold">Days Open</span>
                    <span className="text-white font-bold text-lg tabular-nums" suppressHydrationWarning>
                      {Math.floor((Date.now() - position.placedDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/[0.06]"></div>

              {/* PNL Chart */}
              <div>
                <h2 className="text-base font-semibold text-white mb-3">PNL Performance</h2>
                <div className="relative p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <PNLChart position={position} fullWidth={true} />
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/[0.06]"></div>

              {/* Price Chart */}
              <div>
                <h2 className="text-base font-semibold text-white mb-3">Price Movement</h2>
                <div className="relative p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <PositionChart position={position} fullWidth={true} />
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/[0.06]"></div>

              {/* Price Details */}
              <div>
                <h2 className="text-base font-semibold text-white mb-3">Price Levels</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-white/40 text-[10px] mb-1 uppercase tracking-wider font-semibold">Entry</span>
                    <span className="text-white font-bold text-lg tabular-nums">{position.entryPrice}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-green-400/70 text-[10px] mb-1 uppercase tracking-wider font-semibold">Target</span>
                    <span className="text-green-400 font-bold text-lg tabular-nums">{position.targetPrice}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-red-400/70 text-[10px] mb-1 uppercase tracking-wider font-semibold">Liquidation</span>
                    <span className="text-red-400 font-bold text-lg tabular-nums">{position.liquidation}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/[0.06]"></div>

              {/* Entry Rationale */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-base font-semibold text-white">Entry Rationale</h2>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{position.reason}</p>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/[0.06]"></div>

              {/* Trading Statistics */}
              <div>
                <h2 className="text-base font-semibold text-white mb-3">Trading Statistics</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-white/40 mb-1 text-[10px] uppercase tracking-wider font-semibold">24h Volume</div>
                    <div className="font-bold text-white text-lg tabular-nums">$4.2M</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-white/40 mb-1 text-[10px] uppercase tracking-wider font-semibold">Open Interest</div>
                    <div className="font-bold text-white text-lg tabular-nums">$12.8M</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-white/40 mb-1 text-[10px] uppercase tracking-wider font-semibold">Funding Rate</div>
                    <div className="font-bold text-green-400 text-lg tabular-nums">-0.02%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Desktop Buying Section (hidden on mobile) */}
          <div className={`hidden lg:block lg:col-span-1 transition-all duration-700 delay-600 ${isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
            }`}>
            <div className="sticky top-24">
              <BuyingSection
                position={position}
                bidAmount={bidAmount}
                setBidAmount={setBidAmount}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

