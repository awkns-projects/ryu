"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CirclePlus, CircleMinus, Settings, RefreshCw, MoreVertical, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Agent {
  id: string
  name: string
  description?: string
  icon?: string
  status?: "active" | "paused"
  totalActions?: number
  createdAt: Date
  deposit?: number
  assets?: string[]
  pnl?: string
  pnlPercent?: number
  winRate?: number
  walletAddress?: string
}

interface AgentCardProps {
  agent: Agent
  locale: string
  onDeposit: (agentId: string) => void
  onWithdraw: (agentId: string) => void
  onEdit: (agentId: string) => void
  onEditPrompt?: (agentId: string) => void
  onStartStop: (agentId: string, action: 'start' | 'stop') => void
  onSyncBalance?: (agentId: string) => void
  t: (key: string) => string
}

export function AgentCard({
  agent,
  locale,
  onDeposit,
  onWithdraw,
  onEdit,
  onEditPrompt,
  onStartStop,
  onSyncBalance,
  t,
}: AgentCardProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const agentAny = agent as any

  const pnlPercent = agent.pnlPercent || 0
  const isPositive = pnlPercent >= 0
  const totalProfit = parseFloat(agent.pnl?.replace(/[^0-9.-]/g, '') || '0')
  // Win rate from enhanced API (from Go backend /api/performance)
  const winRate = agentAny.winRate || 0

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate mini performance chart data
  const generateMiniChart = () => {
    const points = 20
    const data: number[] = []
    let value = 50
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.45) * 20 + (pnlPercent / points)
      data.push(Math.max(0, Math.min(100, value)))
    }
    return data
  }

  const chartData = generateMiniChart()

  return (
    <div
      className="relative rounded-lg bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.12] transition-all duration-300 group backdrop-blur-xl overflow-hidden"
      style={{
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

      {/* Card Content */}
      <div className="relative z-10 p-3">
        {/* Top Section: Avatar + Actions */}
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="text-2xl mt-0.5">{agent.icon || '🤖'}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm group-hover:text-white/90 transition-colors">{agent.name}</h3>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onSyncBalance && (
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05] text-white/60 hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation()
                  onSyncBalance(agent.id)
                }}
                title="Sync Balance from Exchange"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05] text-white/60 hover:text-green-400"
              onClick={(e) => {
                e.stopPropagation()
                onDeposit(agent.id)
              }}
              title="Deposit Funds"
            >
              <CirclePlus className="w-3.5 h-3.5" />
            </button>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05] text-white/60 hover:text-amber-400"
              onClick={(e) => {
                e.stopPropagation()
                onWithdraw(agent.id)
              }}
              title="Withdraw Funds"
            >
              <CircleMinus className="w-3.5 h-3.5" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05] text-white/60 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMenuOpen(!isMenuOpen)
                }}
                title="More Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-black border border-white/20 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMenuOpen(false)
                      onEdit(agent.id)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Full Edit
                  </button>
                  {onEditPrompt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        onEditPrompt(agent.id)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Update Prompt
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMenuOpen(false)
                      onDeposit(agent.id)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <CirclePlus className="w-4 h-4" />
                    Deposit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMenuOpen(false)
                      onWithdraw(agent.id)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <CircleMinus className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge + Start/Stop Button */}
        <div className="flex items-center justify-between mb-2">
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
            {agent.status === "active" ? t('statusActive') : t('statusPaused')}
          </span>

          {/* Start/Pause Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStartStop(agent.id, agent.status === 'active' ? 'stop' : 'start')
            }}
            className={cn(
              "p-1.5 rounded-lg transition-all border",
              agent.status === "active"
                ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                : "bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400"
            )}
            title={agent.status === "active" ? "Pause Trader" : "Start Trader"}
          >
            {agent.status === "active" ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z" />
              </svg>
            )}
          </button>
        </div>

        {/* ROI Display */}
        <div className="mb-3">
          <div className={cn(
            "text-2xl font-bold tabular-nums mb-0.5",
            isPositive ? "text-green-400" : "text-red-400"
          )}>
            {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">ROI</div>
        </div>

        {/* Mini Performance Chart */}
        <div className="mb-3 h-16 relative">
          <svg className="w-full h-full" viewBox="0 0 200 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${agent.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isPositive ? "rgb(74, 222, 128)" : "rgb(248, 113, 113)"} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isPositive ? "rgb(74, 222, 128)" : "rgb(248, 113, 113)"} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0 64 ${chartData.map((v, i) => `L ${(i / (chartData.length - 1)) * 200} ${64 - v * 0.56}`).join(' ')} L 200 64 Z`}
              fill={`url(#gradient-${agent.id})`}
            />
            <path
              d={`M 0 ${64 - chartData[0] * 0.56} ${chartData.map((v, i) => `L ${(i / (chartData.length - 1)) * 200} ${64 - v * 0.56}`).join(' ')}`}
              fill="none"
              stroke={isPositive ? "rgb(74, 222, 128)" : "rgb(248, 113, 113)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Stats Grid */}
        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/[0.06]">
          <div>
            <span className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Total Profit</span>
            <div className={cn(
              "font-semibold text-white mt-0.5 tabular-nums",
              isPositive ? "text-cyan-400" : "text-red-400"
            )}>
              ${Math.abs(totalProfit).toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Win Rate</span>
            <div className="font-semibold text-amber-400 mt-0.5 tabular-nums">
              {winRate > 0 ? `${winRate.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

