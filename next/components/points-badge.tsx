"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { PointsActivityDialog } from "./points-activity-dialog"
import { useTranslations } from "next-intl"

interface PointsBadgeProps {
  points?: number
  loading?: boolean
}

export function PointsBadge({ points = 0, loading = false }: PointsBadgeProps) {
  const t = useTranslations('pointsActivity')
  const [displayPoints, setDisplayPoints] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (points !== displayPoints) {
      setIsAnimating(true)
      const duration = 500
      const steps = 20
      const increment = (points - displayPoints) / steps
      let current = displayPoints
      let step = 0

      const timer = setInterval(() => {
        step++
        current += increment
        if (step >= steps) {
          setDisplayPoints(points)
          clearInterval(timer)
          setTimeout(() => setIsAnimating(false), 300)
        } else {
          setDisplayPoints(Math.round(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [points, displayPoints])

  const handleClick = () => {
    if (!loading) {
      setDialogOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-lime-400 to-yellow-300 shadow-lg shadow-lime-500/20 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-lime-950" />
        <span className="text-sm font-medium text-lime-950">---</span>
      </div>
    )
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full 
          bg-gradient-to-r from-lime-400 to-yellow-300
          shadow-lg shadow-lime-500/30
          transition-all duration-300
          hover:from-lime-300 hover:to-yellow-200
          hover:shadow-xl hover:shadow-lime-500/40 hover:scale-105
          cursor-pointer group
          ${isAnimating ? 'ring-2 ring-lime-400/50 scale-105 shadow-xl shadow-lime-500/50' : ''}
        `}
        title={t('clickToView')}
      >
        <Sparkles
          className={`
            w-3.5 h-3.5 text-lime-950
            transition-transform duration-300
            group-hover:rotate-12 group-hover:scale-110
            ${isAnimating ? 'animate-spin' : ''}
          `}
        />
        <span className="text-sm font-semibold text-lime-950 tabular-nums min-w-[2ch] text-right">
          {displayPoints.toLocaleString()}
        </span>
      </div>

      <PointsActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        totalPoints={points}
      />
    </>
  )
}

