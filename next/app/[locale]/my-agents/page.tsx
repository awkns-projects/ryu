"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TemplatesHeader } from "@/components/templates/templates-header"
import { Plus, Settings, Trash2, PlayCircle, FolderOpen, Activity, Calendar, TrendingUp, Loader2, Sparkles, MessageSquare, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/authenticated-fetch"
import { UsageLimitsBanner } from "@/components/usage-limits-banner"
import { SubscriptionBadge } from "@/components/subscription-badge"

// Type for agent from API
interface Agent {
  id: string
  name: string
  description: string
  icon?: string
  status?: "active" | "paused"
  workspaces?: number
  totalActions?: number
  lastActive?: string
  createdAt: Date
  title?: string
  templateId?: string
  metrics?: {
    actionsThisMonth: number
    apiCalls: number
    storageUsed: string
  }
}

export default function MyAgentsPage() {
  const t = useTranslations('myAgents')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch agents from API and handle authentication
  useEffect(() => {
    const fetchAgents = async () => {
      // Wait for session to load
      if (isPending) {
        return
      }

      // Redirect to login if not authenticated
      if (!session) {
        setIsLoading(false)
        router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/my-agents`)}`)
        return
      }

      try {
        setIsLoading(true)
        console.log('📥 Fetching user agents...')

        const response = await api.get<{ agents: any[]; count: number }>('/api/agent', {
          requireAuth: true,
        })

        console.log('✅ Fetched', response.agents.length, 'agents')

        // Map API response to Agent type
        const mappedAgents: Agent[] = response.agents.map((summary: any) => {
          const dbAgent = summary.agent

          return {
            id: dbAgent.id,
            name: dbAgent.name || dbAgent.title || 'Unnamed Agent',
            description: dbAgent.description || 'No description',
            icon: '🤖', // Default icon, could be enhanced with template icons
            status: 'active' as const, // Could be enhanced with actual status from DB
            workspaces: summary.modelsCount || 0,
            totalActions: summary.totalSteps || 0,
            lastActive: 'Recently', // Could be enhanced with actual last active timestamp
            createdAt: new Date(dbAgent.createdAt || Date.now()),
            title: dbAgent.title,
            templateId: dbAgent.templateId,
            metrics: {
              actionsThisMonth: 0, // Could be enhanced with actual metrics
              apiCalls: 0,
              storageUsed: '0 MB',
            },
          }
        })

        setAgents(mappedAgents)
        setError(null)
      } catch (err: any) {
        console.error('❌ Error fetching agents:', err)
        setError(err.message || 'Failed to load agents')

        // If authentication error, redirect to login
        if (err.message?.includes('log in') || err.message?.includes('Authentication')) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/my-agents`)}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [session, isPending, router, locale])

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm(t('confirmDelete'))) {
      return
    }

    try {
      console.log('🗑️ Deleting agent:', agentId)
      await api.delete(`/api/agent/${agentId}`)

      // Remove from local state
      setAgents(agents.filter(a => a.id !== agentId))
      console.log('✅ Agent deleted successfully')
    } catch (err: any) {
      console.error('❌ Failed to delete agent:', err)
      alert('Failed to delete agent. Please try again.')
    }
  }

  const totalWorkspaces = agents.reduce((sum, agent) => sum + (agent.workspaces || 0), 0)
  const totalActions = agents.reduce((sum, agent) => sum + (agent.totalActions || 0), 0)
  const activeAgents = agents.filter(a => a.status === "active").length

  // Show loading state while checking authentication or fetching data
  if (isPending || isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <TemplatesHeader pageTitle={t('title')} />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto max-w-7xl px-4 mb-12">
          {/* Usage limits banner */}
          <div className="mb-6">
            <UsageLimitsBanner
              email={session?.user?.email}
              agentCount={agents.length}
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  {t('title')}
                </h1>
                <SubscriptionBadge
                  email={session?.user?.email}
                  compact={true}
                />
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('description')}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => router.push(`/${locale}/templates`)}
              className="bg-foreground text-background hover:bg-foreground/90 gap-2 w-full lg:w-auto"
            >
              <Plus className="w-5 h-5" />
              {t('createAgent')}
            </Button>
          </div>

        </section>

        {/* Agents Grid */}
        <section className="container mx-auto max-w-7xl px-4">
          {error && (
            <Card className="p-6 mb-6 bg-red-500/10 border-red-500/20">
              <p className="text-red-600 text-center">{error}</p>
            </Card>
          )}

          {agents.length === 0 ? (
            <Card className="p-16 text-center space-y-4">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-2xl font-semibold">{t('empty.title')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('empty.description')}
              </p>
              <Button
                size="lg"
                onClick={() => router.push(`/${locale}/templates`)}
                className="mt-4"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('empty.createFirst')}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className={cn(
                    "p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group",
                    "hover:border-primary/50 hover:scale-[1.02]",
                    agent.status === "paused" && "opacity-60"
                  )}
                  onClick={() => router.push(`/${locale}/agent/${agent.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{agent.icon}</div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle settings
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteAgent(agent.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        agent.status === "active"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      )}>
                        {agent.status === "active" ? t('status.active') : t('status.paused')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('lastActive')}: {agent.lastActive}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          {t('workspaces')}
                        </span>
                        <span className="font-medium">{agent.workspaces}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          {t('totalActions')}
                        </span>
                        <span className="font-medium">{(agent.totalActions || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {t('thisMonth')}
                        </span>
                        <span className="font-medium">{agent.metrics?.actionsThisMonth || 0}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="sm:max-w-[600px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <div className="flex items-start gap-3 sm:gap-4 mb-2">
                <div className="text-3xl sm:text-5xl flex-shrink-0">{selectedAgent.icon}</div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-2xl mb-1">{selectedAgent.name}</DialogTitle>
                  <DialogDescription className="text-xs sm:text-base">
                    {selectedAgent.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <Card className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('detail.status')}</p>
                  <p className="text-sm sm:text-lg font-semibold capitalize">{selectedAgent.status}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('detail.workspaces')}</p>
                  <p className="text-sm sm:text-lg font-semibold">{selectedAgent.workspaces}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('detail.actionsThisMonth')}</p>
                  <p className="text-sm sm:text-lg font-semibold">{selectedAgent.metrics?.actionsThisMonth || 0}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('detail.apiCalls')}</p>
                  <p className="text-sm sm:text-lg font-semibold">{(selectedAgent.metrics?.apiCalls || 0).toLocaleString()}</p>
                </Card>
              </div>

              <Card className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold mb-2">{t('detail.metrics')}</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('detail.totalActions')}</span>
                    <span className="font-medium">{(selectedAgent.totalActions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('detail.storageUsed')}</span>
                    <span className="font-medium">{selectedAgent.metrics?.storageUsed || '0 MB'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('detail.created')}</span>
                    <span className="font-medium">{selectedAgent.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t('detail.lastActive')}</span>
                    <span className="font-medium">{selectedAgent.lastActive}</span>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button className="flex-1" variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">{t('detail.settings')}</span>
                </Button>
                <Button className="flex-1 bg-foreground text-background hover:bg-foreground/90" size="sm">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">{t('detail.viewWorkspaces')}</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

