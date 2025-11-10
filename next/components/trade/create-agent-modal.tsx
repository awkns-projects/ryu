"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, DollarSign, Check, ChevronRight, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"

interface PromptTemplate {
  name: string
  content?: string
  description?: string
  image?: string
}

interface CryptoAsset {
  id: string
  name: string
  symbol: string
}

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  currentStep: number
  stepDirection: 'forward' | 'backward'
  totalSteps: number
  agentName: string
  selectedTemplate: PromptTemplate | null
  customPrompt: string
  useTemplate: boolean
  selectedAssets: string[]
  deposit: string
  leverage: number
  isCreating: boolean
  purchasedTemplates: PromptTemplate[]
  cryptoAssets: CryptoAsset[]
  onAgentNameChange: (value: string) => void
  onTemplateSelect: (template: PromptTemplate | null) => void
  onCustomPromptChange: (value: string) => void
  onUseTemplateToggle: (use: boolean) => void
  onAssetsChange: (assets: string[]) => void
  onDepositChange: (value: string) => void
  onLeverageChange: (value: number) => void
  onNext: () => void
  onPrevious: () => void
  onCreate: () => void
  onReset: () => void
  getCryptoIconUrl: (symbol: string) => string
  t: (key: string, params?: any) => string
}

export function CreateAgentModal({
  isOpen,
  onClose,
  currentStep,
  stepDirection,
  totalSteps,
  agentName,
  selectedTemplate,
  customPrompt,
  useTemplate,
  selectedAssets,
  deposit,
  leverage,
  isCreating,
  purchasedTemplates,
  cryptoAssets,
  onAgentNameChange,
  onTemplateSelect,
  onCustomPromptChange,
  onUseTemplateToggle,
  onAssetsChange,
  onDepositChange,
  onLeverageChange,
  onNext,
  onPrevious,
  onCreate,
  onReset,
  getCryptoIconUrl,
  t,
}: CreateAgentModalProps) {
  const handleClose = (open: boolean) => {
    if (!open) onReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">{t('createNewAgent')}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t('createAgentDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-white/70">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-xs font-semibold text-white">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="relative h-2.5 bg-white/[0.12] rounded-full overflow-hidden border border-white/[0.08]">
            <motion.div
              className="absolute top-0 left-0 h-full bg-white rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          {/* Step Labels */}
          <div className="flex justify-between mt-3 px-1">
            {['Name', 'Strategy', 'Assets', 'Deposit'].map((label, index) => (
              <div
                key={label}
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  currentStep > index + 1
                    ? "text-white/80"
                    : currentStep === index + 1
                      ? "text-white font-bold"
                      : "text-white/35"
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={stepDirection}>
            {/* Step 1: Agent Name */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                custom={stepDirection}
                initial={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? 100 : -100
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? -100 : 100
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{t('step1Title')}</h3>
                  <p className="text-sm text-white/60 mb-4">{t('step1Description')}</p>
                </div>
                <Input
                  placeholder={t('agentNamePlaceholder')}
                  value={agentName}
                  onChange={(e) => onAgentNameChange(e.target.value)}
                  className="text-lg p-6"
                />
              </motion.div>
            )}

            {/* Step 2: Template or Prompt */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                custom={stepDirection}
                initial={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? 100 : -100
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? -100 : 100
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{t('step2Title')}</h3>
                  <p className="text-sm text-white/60 mb-4">{t('step2Description')}</p>
                </div>

                {/* Toggle between template and custom */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={useTemplate ? "default" : "outline"}
                    onClick={() => onUseTemplateToggle(true)}
                    className="flex-1"
                  >
                    {t('useTemplate')}
                  </Button>
                  <Button
                    variant={!useTemplate ? "default" : "outline"}
                    onClick={() => onUseTemplateToggle(false)}
                    className="flex-1"
                  >
                    {t('customPrompt')}
                  </Button>
                </div>

                {useTemplate ? (
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {purchasedTemplates.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Loading templates...</p>
                      </div>
                    ) : (
                      purchasedTemplates.map((template) => (
                        <div
                          key={template.name}
                          className={cn(
                            "group relative p-4 rounded-lg cursor-pointer transition-all duration-200",
                            selectedTemplate?.name === template.name
                              ? "bg-white/[0.08] border-2 border-white/40 shadow-lg shadow-white/10 ring-1 ring-white/20"
                              : "bg-white/[0.03] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]"
                          )}
                          onClick={() => onTemplateSelect(template)}
                        >
                          {selectedTemplate?.name === template.name && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-black stroke-[3]" />
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ring-1 ring-white/20">
                              {template.image ? (
                                <img
                                  src={template.image}
                                  alt={template.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">📋</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={cn(
                                "font-semibold mb-1 transition-colors duration-200",
                                selectedTemplate?.name === template.name ? "text-white" : "text-white/80 group-hover:text-white"
                              )}>
                                {template.name}
                              </h4>
                              <p className={cn(
                                "text-sm mb-2 transition-colors duration-200 line-clamp-2",
                                selectedTemplate?.name === template.name ? "text-white/60" : "text-white/50 group-hover:text-white/60"
                              )}>
                                {template.description || 'No description'}
                              </p>
                              {selectedTemplate?.name === template.name && template.content && (
                                <div className="mt-3 p-3 bg-white/[0.05] rounded-md border border-white/[0.08]">
                                  <p className="text-xs text-white/60 font-mono line-clamp-3">
                                    {template.content}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <Textarea
                    placeholder={t('customPromptPlaceholder')}
                    value={customPrompt}
                    onChange={(e) => onCustomPromptChange(e.target.value)}
                    className="min-h-[300px] resize-none"
                  />
                )}
              </motion.div>
            )}

            {/* Step 3: Select Assets */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                custom={stepDirection}
                initial={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? 100 : -100
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? -100 : 100
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{t('step3Title')}</h3>
                  <p className="text-sm text-white/60 mb-4">{t('step3Description')}</p>
                </div>

                <div className="grid grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-2">
                  {cryptoAssets.map((asset) => {
                    const isSelected = selectedAssets.includes(asset.id)
                    return (
                      <div
                        key={asset.id}
                        className={cn(
                          "group relative p-3.5 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center",
                          isSelected
                            ? "bg-white/[0.08] border-2 border-white/40 shadow-lg shadow-white/10 ring-1 ring-white/20"
                            : "bg-white/[0.03] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]"
                        )}
                        onClick={() => {
                          if (isSelected) {
                            onAssetsChange(selectedAssets.filter(id => id !== asset.id))
                          } else {
                            onAssetsChange([...selectedAssets, asset.id])
                          }
                        }}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-black stroke-[3]" />
                            </div>
                          </div>
                        )}
                        <div className={cn(
                          "w-11 h-11 rounded-lg flex items-center justify-center mb-2.5 p-2 transition-all duration-200",
                          isSelected
                            ? "bg-white/10 ring-1 ring-white/20"
                            : "bg-white/[0.05] group-hover:bg-white/10"
                        )}>
                          <img
                            src={getCryptoIconUrl(asset.symbol)}
                            alt={asset.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                        <div className="w-full">
                          <div className={cn(
                            "font-semibold text-xs mb-0.5 transition-colors duration-200",
                            isSelected ? "text-white" : "text-white/70 group-hover:text-white/90"
                          )}>{asset.id}</div>
                          <div className={cn(
                            "text-[10px] transition-colors duration-200 line-clamp-1",
                            isSelected ? "text-white/60" : "text-white/40 group-hover:text-white/50"
                          )}>
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Deposit */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                custom={stepDirection}
                initial={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? 100 : -100
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: stepDirection === 'forward' ? -100 : 100
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{t('step4Title')}</h3>
                  <p className="text-sm text-white/60 mb-4">{t('step4Description')}</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <Input
                      type="number"
                      placeholder="1000"
                      value={deposit}
                      onChange={(e) => onDepositChange(e.target.value)}
                      className="text-lg p-6 pl-12"
                      min="0"
                      step="100"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => onDepositChange(amount.toString())}
                        className="text-sm"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  {/* Leverage Settings */}
                  <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="font-semibold text-white/80">
                        Leverage
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-white tabular-nums">{leverage}x</span>
                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase ${leverage <= 5
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : leverage <= 10
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {leverage <= 5 ? 'Safe' : leverage <= 10 ? 'Medium' : 'High Risk'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={leverage}
                      onChange={(e) => onLeverageChange(parseInt(e.target.value))}
                      className="slider-thumb w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-xs text-white/40">
                      <span>1x</span>
                      <span>5x</span>
                      <span>10x</span>
                      <span>20x</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentStep === 1 || isCreating}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('previous')}
          </Button>
          {currentStep < totalSteps ? (
            <Button
              onClick={onNext}
              disabled={
                (currentStep === 1 && !agentName.trim()) ||
                (currentStep === 2 && useTemplate && !selectedTemplate) ||
                (currentStep === 2 && !useTemplate && !customPrompt.trim()) ||
                (currentStep === 3 && selectedAssets.length === 0)
              }
              className="flex-1"
            >
              {t('next')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onCreate}
              disabled={isCreating || !deposit || parseFloat(deposit) <= 0}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('createAgent')
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

