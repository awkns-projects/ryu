"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from 'qrcode.react'
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  currentBalance: number
  requiredBalance: number
  isCheckingBalance: boolean
  onStartTrader: () => void
  onRefreshBalance: () => void
}

export function DepositModal({
  isOpen,
  onClose,
  walletAddress,
  currentBalance,
  requiredBalance,
  isCheckingBalance,
  onStartTrader,
  onRefreshBalance,
}: DepositModalProps) {
  const isSufficient = currentBalance >= requiredBalance

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/[0.08] w-[95vw] sm:w-full backdrop-blur-sm">
        <DialogHeader className="pb-4 border-b border-white/[0.06]">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-white">
            Fund Your Trading Account
          </DialogTitle>
          <DialogDescription className="text-sm text-white/40 mt-2">
            Deposit USDC to your Hyperliquid wallet to start trading
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {/* Balance Status */}
          <div className={cn(
            "p-4 rounded-lg border",
            isSufficient
              ? "bg-green-500/10 border-green-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Current Balance</span>
              <span className={cn(
                "text-xl font-bold tabular-nums",
                isSufficient ? "text-green-400" : "text-yellow-400"
              )}>
                ${currentBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/80">Required Balance</span>
              <span className="text-xl font-bold text-white/60 tabular-nums">
                ${requiredBalance.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-white/[0.08] rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  isSufficient ? "bg-green-400" : "bg-yellow-400"
                )}
                style={{
                  width: `${Math.min((currentBalance / requiredBalance) * 100, 100)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-white/40">
                {isSufficient
                  ? '✅ Sufficient funds deposited'
                  : `💰 Need $${(requiredBalance - currentBalance).toFixed(2)} more`}
              </span>
              {isCheckingBalance && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking...
                </span>
              )}
            </div>
          </div>

          {/* Wallet Address Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">Wallet Address</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.03] hover:border-white/[0.08] transition-all">
              <code className="flex-1 text-xs sm:text-sm text-white/80 font-mono break-all">
                {walletAddress}
              </code>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress)
                  alert('✅ Wallet address copied!')
                }}
                className="w-full sm:w-auto shrink-0 bg-white text-black hover:bg-white/90 h-8 px-3 text-xs"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-3 py-4">
            <h3 className="text-sm font-medium text-white/60">Scan QR Code</h3>
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={walletAddress}
                size={180}
                level="H"
                includeMargin={true}
                className="w-[180px] h-[180px]"
              />
            </div>
          </div>

          {/* Deposit Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">How to Deposit</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <div className="shrink-0 w-6 h-6 flex items-center justify-center bg-white/[0.08] rounded text-white text-xs font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-0.5">Direct Transfer</p>
                  <p className="text-xs text-white/50">
                    Send USDC to the wallet address above on Arbitrum network
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <div className="shrink-0 w-6 h-6 flex items-center justify-center bg-white/[0.08] rounded text-white text-xs font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-0.5">Bridge</p>
                  <p className="text-xs text-white/50">
                    Use{' '}
                    <a
                      href="https://app.hyperliquid.xyz/bridge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white underline"
                    >
                      Hyperliquid Bridge
                    </a>
                    {' '}to transfer USDC from other chains
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <div className="shrink-0 w-6 h-6 flex items-center justify-center bg-white/[0.08] rounded text-white text-xs font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-0.5">CEX Withdrawal</p>
                  <p className="text-xs text-white/50">
                    Withdraw USDC from centralized exchanges (Binance, Coinbase, etc.)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
              ⚠️ Important
            </h4>
            <ul className="text-xs text-white/50 space-y-1.5">
              <li>• Only send USDC on <strong className="text-white/70">Arbitrum network</strong></li>
              <li>• Do not send any other tokens or coins</li>
              <li>• Minimum deposit: <strong className="text-white/70">$10 USDC</strong> recommended</li>
              <li>• Trading will start automatically once funds are detected</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {isSufficient ? (
              <>
                <Button
                  onClick={onStartTrader}
                  className="w-full bg-green-500 text-white hover:bg-green-600 h-11 font-semibold text-base flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z" />
                  </svg>
                  Start Trader
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.05] border-white/[0.08] h-9"
                >
                  Close
                </Button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.05] border-white/[0.08] h-9"
                >
                  Close
                </Button>
                <Button
                  onClick={onRefreshBalance}
                  disabled={isCheckingBalance}
                  className="flex-1 bg-white text-black hover:bg-white/90 h-9 font-medium flex items-center justify-center gap-2"
                >
                  {isCheckingBalance ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Balance
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

