"use client"

import React, { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TemplatesHeader } from "@/components/templates/templates-header"
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, Loader2, Sparkles, X as XIcon, Shuffle } from "lucide-react"
import { WarpBackground } from "@/components/ui/warp-background"
import { BackToMyAgentsButton } from "@/components/back-to-my-agents-button"
import { useAgentCreator } from "@/hooks/use-agent-creator"
import { Badge } from "@/components/ui/badge"
import { PILOT_EXAMPLES, getRandomExample } from "@/lib/pilot-examples"

const AVAILABLE_CONNECTIONS = [
  { id: 'google', name: 'Google', icon: '🔍', description: 'Gmail, Calendar, Drive' },
  { id: 'facebook', name: 'Facebook', icon: '📘', description: 'Posts, Pages, Ads' },
  { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Posts, Stories, Insights' },
  { id: 'threads', name: 'Threads', icon: '🧵', description: 'Posts, Replies' },
  { id: 'x', name: 'X (Twitter)', icon: '𝕏', description: 'Tweets, DMs, Analytics' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Videos, Analytics' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Messages, Bots' },
  { id: 'ccxt', name: 'CCXT', icon: '₿', description: 'Crypto Exchanges' },
] as const

export default function PilotTestingPage() {
  const t = useTranslations('pilot')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { isCreating, error: creationError, progress, createAgent, agentId } = useAgentCreator()
  const [currentStep, setCurrentStep] = useState(0)
  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [showSuccessView, setShowSuccessView] = useState(false)

  const steps = [
    { title: t('steps.agentDetails'), description: t('steps.agentDetailsDesc') },
    { title: t('steps.connections'), description: t('steps.connectionsDesc') },
    { title: t('steps.review'), description: t('steps.reviewDesc') }
  ]

  // Show success view when agent is created
  React.useEffect(() => {
    if (agentId && !isCreating) {
      setShowSuccessView(true)
    }
  }, [agentId, isCreating])

  const toggleConnection = (connectionId: string) => {
    setSelectedConnections(prev =>
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    )
  }

  const loadRandomExample = () => {
    const example = getRandomExample()
    setAgentName(example.name)
    setAgentDescription(example.description)
    setSelectedConnections(example.connections)
  }

  const loadExample = (example: typeof PILOT_EXAMPLES[0]) => {
    setAgentName(example.name)
    setAgentDescription(example.description)
    setSelectedConnections(example.connections)
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return agentName.trim() && agentDescription.trim() && agentDescription.length >= 50
      case 1:
        return true // Connections are optional
      case 2:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await createAgent({
        agentName: agentName,
        agentDescription: agentDescription,
        connections: selectedConnections.length > 0 ? selectedConnections : undefined,
      })
    } catch (error) {
      console.error('Error submitting agent:', error)
    }
  }

  // Protect the page - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/pilot`)}`)
    }
  }, [session, isPending, router, locale])

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If no session, don't render anything (will redirect)
  if (!session) {
    return null
  }

  // Creating/Success view - show when creating or when complete
  if (isCreating || (showSuccessView && agentId)) {
    const isComplete = showSuccessView && agentId
    return (
      <div className="min-h-screen bg-background">
        <TemplatesHeader pageTitle={t('title')} />

        <WarpBackground>
          <div className="container mx-auto max-w-4xl w-full px-4">
            <div className="pt-6 sm:pt-8 pb-8">
              <BackToMyAgentsButton className="text-sm sm:text-base -ml-2" />
            </div>

            {/* Creating/Success Card */}
            <Card className={`shadow-2xl border-border/50 backdrop-blur-xl ${isComplete ? 'bg-card/95' : 'bg-card/90'
              }`}>
              <CardHeader className="text-center pb-6">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isComplete ? 'bg-green-500/10' : 'bg-primary/10'
                  }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-primary" />
                  )}
                </div>
                <CardTitle className="text-3xl">
                  {isComplete ? 'Agent Created Successfully!' : 'Creating Your Agent...'}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {isComplete
                    ? "Your AI agent has been created and configured. You'll be redirected shortly."
                    : "Please wait while AI generates your agent's features, models, and actions."
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Agent Details - Read-only */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Agent Summary
                  </h3>

                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Agent Name</Label>
                      <p className="text-base font-medium mt-1">{agentName}</p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Description</Label>
                      <p className="text-base mt-1 whitespace-pre-wrap leading-relaxed">{agentDescription}</p>
                    </div>

                    {selectedConnections.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Connected Services</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedConnections.map((id) => {
                            const connection = AVAILABLE_CONNECTIONS.find(c => c.id === id)
                            return (
                              <Badge key={id} className="gap-2 bg-primary/10 text-primary border-primary/20">
                                <span className="text-lg">{connection?.icon}</span>
                                <span>{connection?.name}</span>
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress indicator - while creating */}
                {isCreating && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-primary">AI is working...</p>
                        <p className="text-sm text-muted-foreground mt-1">{progress}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {creationError && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold text-destructive">Error</h4>
                    <p className="text-sm text-muted-foreground">{creationError}</p>
                  </div>
                )}

                {/* Success - Redirect indicator */}
                {isComplete && (
                  <>
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                        <div>
                          <p className="font-medium text-green-600">Redirecting to your agent...</p>
                          <p className="text-sm text-muted-foreground mt-1">You'll be automatically redirected to configure your new agent</p>
                        </div>
                      </div>
                    </div>

                    {/* Manual navigation button */}
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => router.push(`/${locale}/agent/${agentId}`)}
                        className="bg-foreground text-background hover:bg-foreground/90"
                      >
                        Go to Agent Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </WarpBackground>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TemplatesHeader pageTitle={t('title')} />

      <WarpBackground >
        <div className="container mx-auto max-w-4xl w-full">
          {/* Back Button */}
          <div className="pt-6 sm:pt-8 px-4">
            <BackToMyAgentsButton className="text-sm sm:text-base -ml-2" />
          </div>

          {/* Header */}
          <div className="text-center my-6 sm:my-8 md:my-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-muted/50 backdrop-blur-sm text-xs font-medium shadow-sm mb-4 sm:mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-muted-foreground">{t('badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4 px-4">
              {t('title')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('description')}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-6 sm:mb-8 md:mb-12 px-2">
            <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  {/* Step Circle and Label */}
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${index < currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : index === currentStep
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground'
                      }`}>
                      {index < currentStep ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5" fill={index === currentStep ? "currentColor" : "none"} />
                      )}
                    </div>
                    <div className="text-center mt-1 sm:mt-2 w-16 sm:w-20 md:min-w-[100px]">
                      <p className={`text-xs sm:text-sm font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`h-[2px] w-8 sm:w-16 md:w-24 mx-1 sm:mx-2 md:mx-4 mb-4 sm:mb-6 transition-all ${index < currentStep ? 'bg-primary' : 'bg-border'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card className="shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {/* Step 0: Agent Details */}
              {currentStep === 0 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Example Templates */}
                  <div className="p-4 border border-border/50 rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm sm:text-base font-semibold">
                        {t('examples.title')}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadRandomExample}
                        className="gap-2"
                      >
                        <Shuffle className="w-3 h-3" />
                        {t('examples.random')}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {PILOT_EXAMPLES.slice(0, 8).map((example) => (
                        <button
                          key={example.name}
                          type="button"
                          onClick={() => loadExample(example)}
                          className="p-2 text-left border border-border rounded hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <div className="text-lg mb-1">{example.icon}</div>
                          <div className="text-xs font-medium truncate">{example.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base">{t('fields.agentName')} *</Label>
                    <Input
                      id="name"
                      placeholder={t('placeholders.agentName')}
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-sm sm:text-base">{t('fields.agentDescription')} *</Label>
                      <span className="text-xs text-muted-foreground">
                        {agentDescription.length}/500 {t('fields.characters')}
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder={t('placeholders.agentDescription')}
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value.slice(0, 500))}
                      rows={8}
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('hints.agentDescription')}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Connections */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm sm:text-base">
                      {t('fields.connections')}
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('placeholders.connections')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_CONNECTIONS.map((connection) => (
                      <button
                        key={connection.id}
                        type="button"
                        onClick={() => toggleConnection(connection.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${selectedConnections.includes(connection.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{connection.icon}</span>
                            <span className="font-semibold text-sm sm:text-base">{connection.name}</span>
                          </div>
                          {selectedConnections.includes(connection.id) && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{connection.description}</p>
                      </button>
                    ))}
                  </div>

                  {selectedConnections.length > 0 && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium mb-2">Selected Connections:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedConnections.map((id) => {
                          const connection = AVAILABLE_CONNECTIONS.find(c => c.id === id)
                          return (
                            <Badge key={id} className="gap-1 bg-secondary text-secondary-foreground">
                              <span>{connection?.icon}</span>
                              <span>{connection?.name}</span>
                              <button
                                onClick={() => toggleConnection(id)}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Step 2: Review */}
              {currentStep === 2 && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Creation Progress */}
                  {isCreating && (
                    <div className="p-4 sm:p-6 border border-primary/30 rounded-lg bg-primary/5 space-y-3">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <div>
                          <h4 className="font-semibold text-primary">Creating Your Agent</h4>
                          <p className="text-sm text-muted-foreground mt-1">{progress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {creationError && (
                    <div className="p-4 sm:p-6 border border-destructive/30 rounded-lg bg-destructive/5 space-y-2">
                      <h4 className="font-semibold text-destructive">Error</h4>
                      <p className="text-sm text-muted-foreground">{creationError}</p>
                    </div>
                  )}

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">{t('review.agentDetails')}</h3>
                    <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/30 space-y-2 sm:space-y-3">
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('fields.agentName')}:</span>
                        <p className="text-sm sm:text-base mt-1">{agentName}</p>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('fields.agentDescription')}:</span>
                        <p className="text-sm sm:text-base mt-1 whitespace-pre-wrap">{agentDescription}</p>
                      </div>
                    </div>
                  </div>

                  {selectedConnections.length > 0 && (
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold">{t('review.connections')}</h3>
                      <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/30">
                        <div className="flex flex-wrap gap-2">
                          {selectedConnections.map((id) => {
                            const connection = AVAILABLE_CONNECTIONS.find(c => c.id === id)
                            return (
                              <Badge key={id} className="gap-1 bg-secondary text-secondary-foreground">
                                <span>{connection?.icon}</span>
                                <span>{connection?.name}</span>
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground">
                      {t('review.aiWillGenerate')}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-2 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="text-sm sm:text-base"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">{t('back')}</span>
                  <span className="xs:hidden">Back</span>
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="bg-foreground text-background hover:bg-foreground/90 text-sm sm:text-base"
                  >
                    <span className="hidden xs:inline">{t('next')}</span>
                    <span className="xs:hidden">Next</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStepValid(currentStep) || isCreating}
                    className="bg-foreground text-background hover:bg-foreground/90 text-sm sm:text-base"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {t('submit')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="mt-6 sm:mt-8 mb-4 text-center text-xs sm:text-sm text-muted-foreground px-4">
            <p>{t('footerNote')}</p>
          </div>
        </div>
      </WarpBackground>
    </div>
  )
}

