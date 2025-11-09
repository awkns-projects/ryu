"use client"

import { useState, use } from "react"
import { useRouter, notFound } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useSession } from "@/lib/auth-client"
import { templates } from "@/lib/templates-data"
import { Button } from "@/components/ui/button"
import { TemplatesHeader } from "@/components/templates/templates-header"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { api } from "@/lib/authenticated-fetch"
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Star,
  Users,
  Zap,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left transition-colors",
          "hover:bg-muted/50",
          isOpen && "bg-muted/30"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const t = useTranslations('templatesMarketplace.templateDetail')
  const router = useRouter()
  const locale = useLocale()
  const { data: session } = useSession()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [agentName, setAgentName] = useState('')

  // Unwrap params Promise
  const { id } = use(params)

  // Find the template
  const template = templates.find(t => t.id === id)

  if (!template) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const handleUseTemplate = () => {
    // Check if user is authenticated
    if (!session) {
      // Redirect to login with current page as redirect destination
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/templates/${template.id}`)}`)
      return
    }

    // Open dialog to prompt for agent name
    setAgentName(template.title) // Default to template title
    setShowNameDialog(true)
    setError(null)
  }

  const handleConfirmCreate = async () => {
    if (!agentName.trim()) {
      setError(t('nameDialog.errorRequired'))
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      console.log('🎨 Creating agent from template:', template.id, 'with name:', agentName)

      // Create agent from template using the API
      const response = await api.post<{
        success: boolean;
        agent: any;
        details: any;
      }>('/api/agent/from-template', {
        templateId: template.id,
        // title: agentName,
        name: agentName, // Use user-provided name
        description: template.shortDescription,
      })

      console.log('✅ Agent created successfully:', response.agent.id)

      // Close dialog
      setShowNameDialog(false)

      // Redirect to the newly created agent page
      router.push(`/${locale}/agent/${response.agent.id}`)
    } catch (err: any) {
      console.error('❌ Failed to create agent from template:', err)
      setError(err.message || 'Failed to create agent. Please try again.')

      // If authentication error, redirect to login
      if (err.message?.includes('log in') || err.message?.includes('Authentication')) {
        setShowNameDialog(false)
        setTimeout(() => {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/templates/${template.id}`)}`)
        }, 2000)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowNameDialog(false)
    setAgentName('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <TemplatesHeader pageTitle={template.title} />

      <main className="pt-20 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-2 hover:bg-muted/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </Button>
          </div>

          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="text-6xl">{template.icon}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2">{template.title}</h1>
                    <p className="text-lg text-muted-foreground">
                      {template.shortDescription}
                    </p>
                  </div>
                  {/* Badges */}
                  {template.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {template.badges.map((badge) => (
                        <span
                          key={badge}
                          className={cn(
                            "text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap",
                            badge === "NEW" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                            badge === "FEATURED" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                            badge === "TRENDING" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                            badge === "UPDATED" && "bg-green-500/10 text-green-600 border-green-500/20",
                            badge === "POPULAR" && "bg-pink-500/10 text-pink-600 border-pink-500/20"
                          )}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                    <Users className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Uses</div>
                      <div className="text-sm font-semibold">{formatUsageCount(template.usageCount)}</div>
                    </div>
                  </div>

                  {template.rating && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                        <div className="text-sm font-semibold">{template.rating}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Setup</div>
                      <div className="text-sm font-semibold">{template.setupTime}m</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                    <Zap className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Level</div>
                      <div className="text-sm font-semibold capitalize">{template.difficulty}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {error && !showNameDialog && (
                    <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                      {error}
                    </div>
                  )}
                  <Button
                    onClick={handleUseTemplate}
                    className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8"
                    size="lg"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {t('useTemplate')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-8"
                    size="lg"
                    asChild
                  >
                    <Link href={`/${locale}/pilot`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('previewDemo')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {template.longDescription}
            </p>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-4">
            {/* Key Features */}
            <CollapsibleSection
              title={t('sections.keyFeatures')}
              icon="✨"
              defaultOpen={true}
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {template.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-3 p-4 rounded-lg bg-muted/30 border">
                    <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                    <div>
                      <h4 className="font-semibold text-base mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {typeof feature.description === 'string'
                          ? feature.description
                          : feature.description.feature}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* How It Works */}
            <CollapsibleSection
              title={t('sections.howItWorks')}
              icon="🔄"
              defaultOpen={true}
            >
              <div className="space-y-3 pt-4">
                {template.howItWorks.map((step) => (
                  <div key={step.order} className="flex gap-4 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* What's Included */}
            <CollapsibleSection
              title={t('sections.included')}
              icon="📦"
              defaultOpen={false}
            >
              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                {['agents', 'actions', 'data', 'docs', 'support'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 border">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-medium">{t(`included.${item}`)}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Integrations */}
            {(template.connections?.length || 0) > 0 && (
              <CollapsibleSection
                title={t('sections.integrations')}
                icon="🔌"
                defaultOpen={false}
              >
                <div className="grid sm:grid-cols-2 gap-3 pt-4">
                  {template.connections?.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{connection.icon}</span>
                        <span className="font-medium">{connection.title}</span>
                      </span>
                      {connection.required && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* AI Features */}
            {template.aiFeatures.length > 0 && (
              <CollapsibleSection
                title={t('sections.aiFeatures')}
                icon="🤖"
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-2 pt-4">
                  {template.aiFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="text-sm px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* OAuth/API Connections */}
            {template.connections && template.connections.length > 0 && (
              <CollapsibleSection
                title="OAuth & API Connections"
                icon="🔐"
                defaultOpen={false}
              >
                <div className="grid sm:grid-cols-1 gap-4 pt-4">
                  {template.connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="p-4 rounded-lg bg-muted/30 border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{connection.icon}</span>
                          <div>
                            <h4 className="font-semibold text-base">{connection.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{connection.description}</p>
                          </div>
                        </div>
                        {connection.required && (
                          <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <div className="text-xs font-medium text-muted-foreground mr-2">Scopes:</div>
                        {connection.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="text-xs px-2 py-1 rounded bg-background border text-muted-foreground"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Data Models */}
            {template.models && template.models.length > 0 && (
              <CollapsibleSection
                title="Data Models"
                icon="📋"
                defaultOpen={false}
              >
                <div className="space-y-4 pt-4">
                  {template.models.map((model, idx) => (
                    <div key={idx} className="p-5 rounded-lg bg-muted/30 border">
                      <h4 className="font-semibold text-base mb-1">{model.name}</h4>
                      {model.description && (
                        <p className="text-sm text-muted-foreground mb-4">{model.description}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {model.fields.map((field, fieldIdx) => (
                          <div key={fieldIdx} className="text-sm p-3 rounded bg-background border">
                            <div className="font-semibold">{field.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{field.type}</div>
                            {field.required && (
                              <span className="text-xs text-red-600">*required</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Automated Schedules */}
            {template.schedules && template.schedules.length > 0 && (
              <CollapsibleSection
                title="Automated Schedules"
                icon="⏰"
                defaultOpen={false}
              >
                <div className="space-y-4 pt-4">
                  {template.schedules.map((schedule, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
                        {schedule.mode === 'recurring' ? '🔄' : '1x'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">{schedule.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{schedule.description}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-3 py-1.5 rounded bg-background border font-medium">
                            {schedule.mode === 'recurring' ? 'Recurring' : 'One-time'}
                          </span>
                          {schedule.intervalHours && (
                            <span className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                              Every {schedule.intervalHours} hour{schedule.intervalHours > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Additional Info */}
            <CollapsibleSection
              title="Additional Information"
              icon="ℹ️"
              defaultOpen={false}
            >
              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-semibold capitalize">{template.category}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <span className="text-sm text-muted-foreground">Pricing Tier</span>
                  <span className="text-sm font-semibold capitalize">{template.pricingTier}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <span className="text-sm text-muted-foreground">Difficulty</span>
                  <span className={cn(
                    "text-xs px-3 py-1 rounded-full border font-medium",
                    template.difficulty === 'beginner' && "bg-green-500/10 text-green-600 border-green-500/20",
                    template.difficulty === 'intermediate' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                    template.difficulty === 'advanced' && "bg-red-500/10 text-red-600 border-red-500/20"
                  )}>
                    {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-semibold">{template.version}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border col-span-2">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-semibold">{formatDate(template.updatedAt)}</span>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 p-8 rounded-xl border bg-muted/30 text-center">
            <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Deploy this template to your workspace and start automating in minutes.
            </p>
            {error && !showNameDialog && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm max-w-md mx-auto">
                {error}
              </div>
            )}
            <Button
              onClick={handleUseTemplate}
              className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8"
              size="lg"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {t('useTemplate')}
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Agent Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={(open) => !open && handleCancelCreate()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('nameDialog.title')}</DialogTitle>
            <DialogDescription className="text-base">
              {t('nameDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-base font-medium">
                {t('nameDialog.label')}
              </Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={t('nameDialog.placeholder')}
                className="h-12 text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleConfirmCreate()
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                {t('nameDialog.defaultHint', { templateTitle: template.title })}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancelCreate}
              disabled={isCreating}
              className="h-11 px-6"
            >
              {t('nameDialog.cancel')}
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={isCreating || !agentName.trim()}
              className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('nameDialog.creating')}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {t('nameDialog.create')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

