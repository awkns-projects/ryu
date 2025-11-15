'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useGoAuth } from '@/contexts/go-auth-context'
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Brain, Check, Trash2, Plus, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface AIModel {
  id: string
  name: string
  provider: string
  enabled: boolean
  custom_api_url?: string
  custom_model_name?: string
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const locale = useLocale()
  const router = useRouter()
  const { user, token, isLoading: isAuthLoading } = useGoAuth()

  const [supportedModels, setSupportedModels] = useState<AIModel[]>([])
  const [configuredModels, setConfiguredModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [customApiUrl, setCustomApiUrl] = useState('')
  const [customModelName, setCustomModelName] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && (!user || !token)) {
      router.push(`/${locale}/auth/go/login?redirect=${encodeURIComponent(`/${locale}/settings`)}`)
    }
  }, [user, token, isAuthLoading, router, locale])

  // Fetch models
  useEffect(() => {
    if (user && token) {
      fetchModels()
    }
  }, [user, token])

  const fetchModels = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      // Fetch supported models (no auth required)
      const supportedResponse = await fetch('/api/go/trade/supported-models')
      if (supportedResponse.ok) {
        const supportedData = await supportedResponse.json()
        setSupportedModels(supportedData.models || [])
      }

      // Fetch user's configured models
      const modelsResponse = await fetch('/api/go/trade/models', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        setConfiguredModels(modelsData.models || [])
      }
    } catch (err) {
      console.error('Failed to fetch models:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModelModal = (model?: AIModel) => {
    if (model) {
      setEditingModel(model)
      setSelectedModelId(model.id || model.provider)
      setApiKey('') // Don't show existing API key for security
      setCustomApiUrl(model.custom_api_url || '')
      setCustomModelName(model.custom_model_name || '')
    } else {
      setEditingModel(null)
      setSelectedModelId('')
      setApiKey('')
      setCustomApiUrl('')
      setCustomModelName('')
    }
    setIsModelModalOpen(true)
  }

  const handleSaveModel = async () => {
    if (!token || !selectedModelId || !apiKey.trim()) return

    // For custom models, require custom_api_url and custom_model_name
    if (selectedModelId === 'custom' || selectedModel?.provider === 'custom') {
      if (!customApiUrl.trim() || !customModelName.trim()) {
        alert('Please provide both Custom API URL and Model Name for custom models')
        return
      }
    }

    setIsSaving(true)
    try {
      // For custom models, use 'custom' as the modelId/provider
      const modelId = selectedModelId === 'custom' ? 'custom' : (editingModel?.id || editingModel?.provider || selectedModelId)
      
      const response = await fetch('/api/go/trade/update-model', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          modelId: modelId,
          enabled: true,
          api_key: apiKey.trim(),
          custom_api_url: customApiUrl.trim() || undefined,
          custom_model_name: customModelName.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save model configuration')
      }

      // Refresh models
      await fetchModels()
      setIsModelModalOpen(false)
      setEditingModel(null)
      setSelectedModelId('')
      setApiKey('')
      setCustomApiUrl('')
      setCustomModelName('')
      
      alert('✅ AI model configured successfully!')
    } catch (err: any) {
      console.error('Failed to save model:', err)
      alert(`Failed to save model: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedModel = selectedModelId
    ? supportedModels.find(m => (m.id || m.provider) === selectedModelId) || 
      configuredModels.find(m => (m.id || m.provider) === selectedModelId) ||
      (selectedModelId === 'custom' ? { id: 'custom', name: 'Custom AI', provider: 'custom' } : null)
    : editingModel

  // Show loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  // If no auth, don't render
  if (!user || !token) return null

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <AppHeader locale={locale} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/60">Configure your AI models and preferences</p>
        </div>

        {/* AI Models Section */}
        <Card className="bg-white/[0.02] border-white/[0.08] mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Models
                </CardTitle>
                <CardDescription className="text-white/60">
                  Configure AI models for your trading agents
                </CardDescription>
              </div>
              <Button
                onClick={() => handleOpenModelModal()}
                size="sm"
                className="bg-white text-black hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {configuredModels.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <p className="text-white/60 mb-4">No AI models configured</p>
                <p className="text-sm text-white/40 mb-4">
                  Configure at least one AI model (e.g., DeepSeek or OpenAI) to create trading agents.
                </p>
                <Button
                  onClick={() => handleOpenModelModal()}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Configure Your First Model
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {configuredModels.map((model) => (
                  <div
                    key={model.id || model.provider}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {model.name || model.provider}
                        </h3>
                        {model.enabled && (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                            Enabled
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/60">
                        Provider: {model.provider} • ID: {model.id || model.provider}
                      </div>
                      {model.custom_api_url && (
                        <div className="text-xs text-white/40 mt-1">
                          Custom API: {model.custom_api_url}
                        </div>
                      )}
                      {model.custom_model_name && (
                        <div className="text-xs text-white/40 mt-1">
                          Model: {model.custom_model_name}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleOpenModelModal(model)}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Configuration Modal */}
      <Dialog open={isModelModalOpen} onOpenChange={setIsModelModalOpen}>
        <DialogContent className="max-w-2xl bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingModel ? 'Edit AI Model' : 'Configure AI Model'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {editingModel
                ? 'Update your AI model configuration'
                : 'Configure a new AI model for your trading agents'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!editingModel && (
              <div>
                <Label className="text-white">Select Model</Label>
                <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                  <SelectTrigger className="bg-white/[0.03] border-white/20 text-white">
                    <SelectValue placeholder="Select an AI model">
                      {selectedModelId
                        ? supportedModels.find(m => (m.id || m.provider) === selectedModelId)?.name ||
                          supportedModels.find(m => (m.id || m.provider) === selectedModelId)?.provider ||
                          (selectedModelId === 'custom' ? 'Custom (OpenAI, etc.)' : selectedModelId)
                        : 'Select an AI model'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {supportedModels.map((model) => (
                      <SelectItem key={model.id || model.provider} value={model.id || model.provider}>
                        {model.name || model.provider} ({model.provider})
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      Custom (OpenAI, OpenRouter, etc.)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedModel && (
              <>
                <div>
                  <Label className="text-white">API Key *</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="bg-white/[0.03] border-white/20 text-white"
                    required
                  />
                  <p className="text-xs text-white/40 mt-1">
                    {selectedModel.provider === 'custom' || selectedModelId === 'custom'
                      ? 'Enter your API key (OpenAI keys start with sk-, OpenRouter keys start with sk-or-)'
                      : selectedModel.provider === 'deepseek'
                        ? 'Enter your DeepSeek API key'
                        : selectedModel.provider === 'qwen'
                          ? 'Enter your Qwen API key'
                          : 'Enter your API key for this model'}
                  </p>
                </div>

                {(selectedModel.provider === 'custom' || selectedModelId === 'custom') && (
                  <>
                    <div>
                      <Label className="text-white">Custom API URL *</Label>
                      <Input
                        type="url"
                        value={customApiUrl}
                        onChange={(e) => setCustomApiUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="bg-white/[0.03] border-white/20 text-white"
                        required
                      />
                      <p className="text-xs text-white/40 mt-1">
                        For OpenAI: https://api.openai.com/v1<br />
                        For OpenRouter: https://openrouter.ai/api/v1<br />
                        For local models (Ollama): http://localhost:11434/v1
                      </p>
                    </div>

                    <div>
                      <Label className="text-white">Model Name *</Label>
                      <Input
                        type="text"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        placeholder="gpt-4o, gpt-4-turbo, anthropic/claude-3.5-sonnet, etc."
                        className="bg-white/[0.03] border-white/20 text-white"
                        required
                      />
                      <p className="text-xs text-white/40 mt-1">
                        Specify the model name (e.g., gpt-4o, gpt-4-turbo, anthropic/claude-3.5-sonnet)
                      </p>
                    </div>
                  </>
                )}

                {selectedModel && selectedModel.provider !== 'custom' && selectedModelId !== 'custom' && (
                  <div>
                    <Label className="text-white">Custom Model Name (Optional)</Label>
                    <Input
                      type="text"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                      placeholder="Leave blank for default"
                      className="bg-white/[0.03] border-white/20 text-white"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Override the default model name if needed
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    <strong>Note:</strong> Your API keys are encrypted and stored securely. 
                    They will be used to make API calls when your trading agents run.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsModelModalOpen(false)
                setEditingModel(null)
                setSelectedModelId('')
                setApiKey('')
                setCustomApiUrl('')
                setCustomModelName('')
              }}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveModel}
              disabled={
                isSaving || 
                !selectedModel || 
                !apiKey.trim() ||
                ((selectedModelId === 'custom' || selectedModel?.provider === 'custom') && (!customApiUrl.trim() || !customModelName.trim()))
              }
              className="flex-1 bg-white text-black hover:bg-white/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

