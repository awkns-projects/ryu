"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, LineChart, X } from "lucide-react"
import { ComparisonChart } from "./ComparisonChart"

interface Trader {
  id: string
  name: string
  totalEquity: number
  pnl: number
  roi: number
  icon: string
}

interface ComparisonChartSectionProps {
  traders: Trader[]
}

export function ComparisonChartSection({ traders }: ComparisonChartSectionProps) {
  const [selectedTraders, setSelectedTraders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showChart, setShowChart] = useState(false)

  const handleToggleTrader = (traderId: string) => {
    if (selectedTraders.includes(traderId)) {
      setSelectedTraders(selectedTraders.filter(id => id !== traderId))
    } else {
      if (selectedTraders.length >= 5) {
        alert('Maximum 5 traders can be compared at once')
        return
      }
      setSelectedTraders([...selectedTraders, traderId])
    }
  }

  const handleShowComparison = () => {
    if (selectedTraders.length < 2) {
      alert('Please select at least 2 traders to compare')
      return
    }
    setShowChart(true)
  }

  const handleClearSelection = () => {
    setSelectedTraders([])
    setShowChart(false)
  }

  const selectedTradersData = traders.filter(t => selectedTraders.includes(t.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <LineChart className="w-6 h-6" />
            Compare Top Traders
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Select 2-5 traders to compare their performance
          </p>
        </div>
        {selectedTraders.length > 0 && (
          <Button
            onClick={handleClearSelection}
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Selection
          </Button>
        )}
      </div>

      {/* Trader Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {traders.slice(0, 10).map((trader) => {
          const isSelected = selectedTraders.includes(trader.id)
          return (
            <button
              key={trader.id}
              onClick={() => handleToggleTrader(trader.id)}
              className={`p-4 rounded-lg border transition-all text-left ${isSelected
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{trader.icon}</span>
                  <div>
                    <div className="font-semibold text-white text-sm">{trader.name}</div>
                    <div className="text-xs text-white/60">
                      ${trader.totalEquity.toFixed(0)}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="text-white text-xs">✓</div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">ROI:</span>
                <span className={trader.roi >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {trader.roi >= 0 ? '+' : ''}{trader.roi.toFixed(2)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Traders Count */}
      {selectedTraders.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">
              {selectedTraders.length} trader{selectedTraders.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              {selectedTradersData.map((trader) => (
                <div
                  key={trader.id}
                  className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs text-white"
                >
                  <span>{trader.icon}</span>
                  <span>{trader.name}</span>
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={handleShowComparison}
            disabled={selectedTraders.length < 2}
            className="bg-white text-black hover:bg-white/90"
          >
            Show Comparison
          </Button>
        </div>
      )}

      {/* Comparison Chart */}
      {showChart && selectedTraders.length >= 2 && (
        <ComparisonChart
          traderIds={selectedTraders}
          traders={selectedTradersData}
          onClose={() => setShowChart(false)}
        />
      )}
    </div>
  )
}

