"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, TrendingUp, TrendingDown, Calendar, Award } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useTranslations } from "next-intl"

interface PointsActivity {
  id: string
  points: number
  activity: string
  description?: string
  createdAt: string
}

interface PointsActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalPoints: number
}

export function PointsActivityDialog({ open, onOpenChange, totalPoints }: PointsActivityDialogProps) {
  const t = useTranslations('pointsActivity')
  const [activities, setActivities] = useState<PointsActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchActivities()
    }
  }, [open])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/points/activity')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Failed to fetch points activity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-lime-400/20 to-yellow-300/20 border border-lime-300/30">
              <Sparkles className="w-5 h-5 text-lime-400" />
            </div>
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* Total Points Summary */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-lime-400/10 to-yellow-300/10 border border-lime-300/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalPoints')}</p>
              <p className="text-3xl font-bold text-lime-400">{totalPoints.toLocaleString()}</p>
            </div>
            <Award className="w-12 h-12 text-lime-400/30" />
          </div>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('noActivityYet')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('noActivityDescription')}</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1 rounded ${activity.points > 0 ? 'bg-lime-400/20' : 'bg-red-400/20'}`}>
                        {activity.points > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                      <h4 className="font-medium text-sm truncate">{activity.activity}</h4>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${activity.points > 0 ? 'text-lime-400' : 'text-red-400'}`}>
                    {activity.points > 0 ? '+' : ''}{activity.points}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

