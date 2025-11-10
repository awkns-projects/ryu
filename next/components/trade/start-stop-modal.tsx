"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Agent {
  id: string
  name: string
  icon?: string
  deposit?: number
  assets?: string[]
}

interface StartStopModalProps {
  isOpen: boolean
  onClose: () => void
  action: 'start' | 'stop'
  agent: Agent | null
  isLoading: boolean
  onConfirm: () => void
}

export function StartStopModal({
  isOpen,
  onClose,
  action,
  agent,
  isLoading,
  onConfirm,
}: StartStopModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border border-white/[0.08] w-[95vw] sm:w-full backdrop-blur-sm">
        <DialogHeader className="pb-4 border-b border-white/[0.06]">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-white">
            {action === 'start' ? 'Start Trader' : 'Stop Trader'}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/40 mt-2">
            {action === 'start'
              ? 'Confirm that you want to start this trading agent'
              : 'Confirm that you want to stop this trading agent'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {/* Confirmation Message */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-lg border",
            action === 'start'
              ? "bg-green-500/10 border-green-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"
          )}>
            <div className={cn(
              "mt-0.5 text-lg",
              action === 'start' ? "text-green-500" : "text-yellow-500"
            )}>
              {action === 'start' ? '▶️' : '⏸️'}
            </div>
            <div className="flex-1 space-y-1">
              <p className={cn(
                "text-sm font-medium",
                action === 'start' ? "text-green-200" : "text-yellow-200"
              )}>
                {action === 'start' ? 'Ready to Start' : 'Confirm Stop'}
              </p>
              <p className={cn(
                "text-xs",
                action === 'start' ? "text-green-200/70" : "text-yellow-200/70"
              )}>
                {action === 'start'
                  ? 'The trader will begin executing trades according to its configured strategy. Make sure you have sufficient balance.'
                  : 'The trader will stop executing new trades. Existing open positions will remain open until manually closed or until stop-loss/take-profit is triggered.'}
              </p>
            </div>
          </div>

          {/* Agent Info */}
          {agent && (
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{agent.icon || '🤖'}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
                  <p className="text-xs text-white/40">Initial Balance: ${agent.deposit?.toFixed(2)}</p>
                </div>
              </div>
              {agent.assets && agent.assets.length > 0 && (
                <div className="text-xs text-white/50">
                  Trading: {agent.assets.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-transparent border-white/[0.12] text-white hover:bg-white/[0.05] h-11"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 h-11 font-medium",
                action === 'start'
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-yellow-500 text-black hover:bg-yellow-600"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {action === 'start' ? 'Starting...' : 'Stopping...'}
                </>
              ) : (
                <>
                  {action === 'start' ? 'Start Trader' : 'Stop Trader'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

