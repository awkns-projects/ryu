"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  withdrawAmount: string
  withdrawAddress: string
  isWithdrawing: boolean
  onAmountChange: (value: string) => void
  onAddressChange: (value: string) => void
  onWithdraw: () => void
}

export function WithdrawModal({
  isOpen,
  onClose,
  withdrawAmount,
  withdrawAddress,
  isWithdrawing,
  onAmountChange,
  onAddressChange,
  onWithdraw,
}: WithdrawModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border border-white/[0.08] w-[95vw] sm:w-full backdrop-blur-sm">
        <DialogHeader className="pb-4 border-b border-white/[0.06]">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-white">
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="text-sm text-white/40 mt-2">
            Withdraw USDC from your trading agent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">
              Amount (USDC)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30 focus:border-white/[0.12] h-12 text-lg"
              min="0"
              step="0.01"
              disabled={isWithdrawing}
            />
            <p className="text-xs text-white/40">
              Enter the amount of USDC you want to withdraw
            </p>
          </div>

          {/* Destination Address Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">
              Destination Address
            </label>
            <Input
              type="text"
              placeholder="0x..."
              value={withdrawAddress}
              onChange={(e) => onAddressChange(e.target.value)}
              className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30 focus:border-white/[0.12] h-12 font-mono text-sm"
              disabled={isWithdrawing}
            />
            <p className="text-xs text-white/40">
              Enter the wallet address to receive the funds (Arbitrum network)
            </p>
          </div>

          {/* Warning Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="text-amber-500 mt-0.5">⚠️</div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-amber-200 font-medium">Important</p>
              <p className="text-xs text-amber-200/70">
                Double-check the destination address. Transactions cannot be reversed.
                Make sure the address is on the Arbitrum network.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-transparent border-white/[0.12] text-white hover:bg-white/[0.05] h-11"
              disabled={isWithdrawing}
            >
              Cancel
            </Button>
            <Button
              onClick={onWithdraw}
              disabled={isWithdrawing || !withdrawAmount || !withdrawAddress}
              className="flex-1 bg-amber-500 text-white hover:bg-amber-600 h-11 font-medium"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

