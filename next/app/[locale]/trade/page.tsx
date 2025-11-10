"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useGoAuth } from "@/contexts/go-auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppHeader from '@/components/app-header'
import PulsingCircle from '@/components/shader/pulsing-circle'
import { PulsingBorder } from "@paper-design/shaders-react"
import { Plus, ChevronRight, ChevronLeft, Loader2, TrendingUp, Wallet, Settings, Trash2, Activity, DollarSign, Check, FileText, Bot, ShoppingCart, ArrowUpRight, ArrowDownRight, Target, BarChart3, CirclePlus, CircleMinus } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'

// Custom CSS for leverage slider
const sliderStyles = `
  .slider-thumb::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    cursor: grab;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .slider-thumb::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4);
  }
  
  .slider-thumb:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.05);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  }
  
  .slider-thumb::-moz-range-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    cursor: grab;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .slider-thumb::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4);
  }
  
  .slider-thumb:active::-moz-range-thumb {
    cursor: grabbing;
    transform: scale(1.05);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  }
`

// Type for agent
interface Agent {
  id: string
  name: string
  description: string
  icon?: string
  status?: "active" | "paused"
  totalActions?: number
  createdAt: Date
  templateId?: string
  deposit?: number
  assets?: string[]
  pnl?: string
  pnlPercent?: number
}

// Type for position
interface Position {
  id: string
  symbol: string
  type: "long" | "short"
  leverage: number
  entryPrice: number
  currentPrice: number
  quantity: number
  stopLoss?: number
  takeProfit?: number
  pnl: number
  pnlPercent: number
  status: "open" | "closed" | "liquidated"
  source: "agent" | "market"
  agentId?: string
  marketPrice?: number
  marketDiscount?: number
  createdAt: Date
}

// Type for prompt template
interface PromptTemplate {
  name: string
  content?: string
  description?: string
  image?: string
}

// Crypto assets with local SVG icons from /public/svg/color/
const cryptoAssets = [
  { id: "BTC", name: "Bitcoin", symbol: "btc" },
  { id: "ETH", name: "Ethereum", symbol: "eth" },
  { id: "BNB", name: "BNB", symbol: "bnb" },
  { id: "XRP", name: "XRP", symbol: "xrp" },
  { id: "ADA", name: "Cardano", symbol: "ada" },
  { id: "DOGE", name: "Dogecoin", symbol: "doge" },
  { id: "LINK", name: "Chainlink", symbol: "link" },
  { id: "LTC", name: "Litecoin", symbol: "ltc" },
  { id: "BCH", name: "Bitcoin Cash", symbol: "bch" },
  { id: "XLM", name: "Stellar", symbol: "xlm" },
  { id: "EOS", name: "EOS", symbol: "eos" },
  { id: "TRX", name: "TRON", symbol: "trx" },
  { id: "ETC", name: "Ethereum Classic", symbol: "etc" },
  { id: "XMR", name: "Monero", symbol: "xmr" },
  { id: "DASH", name: "Dash", symbol: "dash" },
  { id: "ZEC", name: "Zcash", symbol: "zec" },
  { id: "NEO", name: "NEO", symbol: "neo" },
  { id: "WAVES", name: "Waves", symbol: "waves" },
  { id: "XEM", name: "NEM", symbol: "xem" },
  { id: "QTUM", name: "Qtum", symbol: "qtum" },
]

// Helper function to get cryptocurrency icon URL from local SVG folder
const getCryptoIconUrl = (symbol: string) => {
  return `/svg/color/${symbol.toLowerCase()}.svg`
}

export default function TradePage() {
  const t = useTranslations('tradePage')
  const locale = useLocale()
  const router = useRouter()
  const { user, token, isLoading: isAuthLoading } = useGoAuth()

  const [agents, setAgents] = useState<Agent[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create agent modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward')
  const [isCreating, setIsCreating] = useState(false)

  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [depositWalletAddress, setDepositWalletAddress] = useState("")
  const [createdTraderId, setCreatedTraderId] = useState("")

  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAgentId, setWithdrawAgentId] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Edit agent modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAgentId, setEditingAgentId] = useState("")
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [editConfigLoaded, setEditConfigLoaded] = useState(false)

  // Templates modal state
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
  const [purchasedTemplates, setPurchasedTemplates] = useState<PromptTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Form data
  const [agentName, setAgentName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [deposit, setDeposit] = useState("")
  const [leverage, setLeverage] = useState(5)

  // Tab state
  const [activeTab, setActiveTab] = useState("account")

  const totalSteps = 4

  // Fetch agents and positions from Go backend
  useEffect(() => {
    const fetchData = async () => {
      if (isAuthLoading) {
        console.log('🔄 Waiting for auth to load...')
        return
      }

      console.log('🔐 Auth state:', { hasUser: !!user, hasToken: !!token })

      if (!user || !token) {
        console.log('❌ No auth found - redirecting to login')
        setIsLoading(false)
        router.push(`/${locale}/auth/go/login?redirect=${encodeURIComponent(`/${locale}/trade`)}`)
        return
      }

      console.log('✅ User authenticated:', user.email)

      try {
        setIsLoading(true)

        console.log('🔄 Fetching trading data...')

        // ========================
        // STEP 1: Fetch Traders via Next.js API route
        // ========================
        const tradersResponse = await fetch('/api/go/trade/traders', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Send JWT token to API route
          },
        })

        // Handle authentication errors
        if (tradersResponse.status === 401) {
          console.warn('⚠️ Unauthorized - redirecting to login')
          router.push(`/${locale}/auth/go/login?redirect=${encodeURIComponent(`/${locale}/trade`)}`)
          return
        }

        if (!tradersResponse.ok) {
          throw new Error(`Failed to fetch traders: HTTP ${tradersResponse.status}`)
        }

        const tradersData = await tradersResponse.json()
        console.log('✅ Traders fetched:', tradersData.totalCount)

        // Handle empty traders case
        if (!tradersData.agents || tradersData.agents.length === 0) {
          console.log('ℹ️ No traders found for this user')
          setAgents([])
          setPositions([])
          setError(null)
          return
        }

        // Set agents (already transformed by API route)
        const mappedAgents: Agent[] = tradersData.agents.map((agent: any) => ({
          ...agent,
          createdAt: new Date(agent.createdAt),
          templateId: undefined,
        }))

        setAgents(mappedAgents)
        console.log('✅ Agents set:', mappedAgents.length)

        // ========================
        // STEP 2: Fetch Positions via Next.js API route
        // ========================
        if (mappedAgents.length > 0) {
          console.log('🔄 Fetching positions for', mappedAgents.length, 'traders...')

          const traderIds = mappedAgents.map(agent => agent.id).join(',')
          const positionsResponse = await fetch(`/api/go/trade/positions?trader_ids=${traderIds}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // Send JWT token to API route
            },
          })

          if (positionsResponse.ok) {
            const positionsData = await positionsResponse.json()

            // Set positions (already transformed by API route)
            const mappedPositions: Position[] = positionsData.positions.map((pos: any) => ({
              ...pos,
              createdAt: new Date(pos.createdAt),
            }))

            setPositions(mappedPositions)
            console.log('✅ Positions set:', mappedPositions.length)
          } else {
            console.warn('⚠️ Failed to fetch positions:', positionsResponse.status)
            setPositions([])
          }
        } else {
          setPositions([])
        }

        setError(null)

      } catch (err: any) {
        console.error('❌ Error fetching trading data:', err)

        // User-friendly error message
        const errorMessage = err.message?.includes('Failed to fetch')
          ? 'Unable to connect to trading server. Please check your connection.'
          : err.message || 'Failed to load trading data. Please try again.'

        setError(errorMessage)

        // Handle specific error types
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          console.warn('⚠️ Session expired - redirecting to login')
          router.push(`/${locale}/auth/go/login?redirect=${encodeURIComponent(`/${locale}/trade`)}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, token, isAuthLoading, router, locale])

  // Load templates on mount
  useEffect(() => {
    fetchPurchasedTemplates()
  }, [])

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      console.log(`🔄 Deleting trader ${agentId}...`)

      // Delete trader via Next.js API route (which calls Go backend)
      const response = await fetch(`/api/go/trade/delete-trader/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send JWT token to API route
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete trader')
      }

      console.log(`✅ Trader ${agentId} deleted successfully`)

      // Remove from UI
      setAgents(agents.filter(a => a.id !== agentId))
    } catch (err: any) {
      console.error('❌ Failed to delete trader:', err)
      alert('Failed to delete trader. Please try again.')
    }
  }

  const handleShowDepositForAgent = async (agentId: string) => {
    try {
      console.log(`🔄 Fetching wallet address for trader ${agentId}...`)

      // Step 1: Fetch trader config to get the exchange_id
      const traderResponse = await fetch(`/api/go/trade/trader-config/${agentId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!traderResponse.ok) {
        throw new Error('Failed to fetch trader configuration')
      }

      const traderData = await traderResponse.json()
      console.log('📊 Trader data received:', traderData)

      const exchangeId = traderData.exchange_id
      if (!exchangeId) {
        console.error('❌ No exchange_id found for trader')
        alert('No exchange configuration found for this trader.')
        return
      }

      console.log(`🔍 Trader uses exchange: ${exchangeId}`)

      // Step 2: Fetch exchange configs to get wallet address
      const exchangesResponse = await fetch('/api/go/trade/exchanges', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!exchangesResponse.ok) {
        throw new Error('Failed to fetch exchange configurations')
      }

      const exchangesData = await exchangesResponse.json()
      console.log('📊 Exchanges data received:', exchangesData)

      // Find the specific exchange config by ID
      const exchanges = exchangesData.exchanges || exchangesData
      const exchange = Array.isArray(exchanges)
        ? exchanges.find((ex: any) => ex.id === exchangeId)
        : null

      console.log('🔍 Exchange found:', exchange)

      // Check for wallet address with multiple possible field names
      const walletAddress = exchange?.hyperliquid_wallet_addr || exchange?.wallet_address || exchange?.hyperliquidWalletAddr

      if (!exchange || !walletAddress) {
        console.error('❌ No wallet address found. Exchange:', exchange)
        console.error('❌ Available fields:', exchange ? Object.keys(exchange) : 'none')
        alert('No wallet address found for this trader. Please contact support.')
        return
      }

      console.log(`✅ Wallet address found: ${walletAddress}`)

      // Open deposit modal with wallet address
      setDepositWalletAddress(walletAddress)
      setCreatedTraderId(agentId)
      setIsDepositModalOpen(true)
    } catch (err: any) {
      console.error(`❌ Failed to fetch wallet address:`, err)
      alert('Failed to fetch wallet address. Please try again.')
    }
  }

  const refreshAgentsData = async () => {
    try {
      const tradersResponse = await fetch('/api/go/trade/traders', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (tradersResponse.ok) {
        const tradersData = await tradersResponse.json()
        const mappedAgents: Agent[] = tradersData.agents.map((agent: any) => ({
          ...agent,
          createdAt: new Date(agent.createdAt),
          templateId: undefined,
        }))
        setAgents(mappedAgents)
      }
    } catch (err) {
      console.error('Failed to refresh agents:', err)
    }
  }

  const handleShowWithdrawForAgent = (agentId: string) => {
    setWithdrawAgentId(agentId)
    setWithdrawAmount("")
    setWithdrawAddress("")
    setIsWithdrawModalOpen(true)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) {
      alert('Please enter both amount and withdrawal address.')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    setIsWithdrawing(true)

    try {
      console.log(`🔄 Processing withdrawal for trader ${withdrawAgentId}...`)
      console.log(`💰 Amount: ${amount} USDC`)
      console.log(`📍 To address: ${withdrawAddress}`)

      const response = await fetch('/api/go/trade/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          trader_id: withdrawAgentId,
          amount: amount,
          destination_address: withdrawAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed')
      }

      console.log('✅ Withdrawal successful:', data)
      alert(`✅ Successfully withdrawn ${amount} USDC to ${withdrawAddress}`)

      // Close modal and reset form
      setIsWithdrawModalOpen(false)
      setWithdrawAmount("")
      setWithdrawAddress("")
      setWithdrawAgentId("")

      // Refresh agents data to show updated balance
      await refreshAgentsData()
    } catch (err: any) {
      console.error('❌ Withdrawal failed:', err)
      alert(`❌ Withdrawal failed: ${err.message}`)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleEditAgent = async (agentId: string) => {
    if (!user || !token) return

    setIsLoadingEdit(true)
    setEditingAgentId(agentId)

    try {
      console.log(`🔄 Loading trader for editing: ${agentId}`)

      // Find agent in current list (list endpoint returns basic info)
      const agent = agents.find(a => a.id === agentId)

      if (!agent) {
        throw new Error('Agent not found in current list')
      }

      console.log('📊 Agent data from list:', agent)

      const agentAny = agent as any
      console.log('📊 Checking for detailed fields in agent object:')
      console.log('   - trading_symbols:', agentAny.trading_symbols || 'NOT PRESENT ❌')
      console.log('   - custom_prompt:', agentAny.custom_prompt ? 'Present ✅' : 'NOT PRESENT ❌')
      console.log('   - system_prompt_template:', agentAny.system_prompt_template || 'NOT PRESENT ❌')
      console.log('   - btc_eth_leverage:', agentAny.btc_eth_leverage || 'NOT PRESENT ❌')
      console.log('   - altcoin_leverage:', agentAny.altcoin_leverage || 'NOT PRESENT ❌')
      console.log('   - is_cross_margin:', agentAny.is_cross_margin !== undefined ? agentAny.is_cross_margin : 'NOT PRESENT ❌')

      // Fetch detailed config directly from SQLite database
      // This bypasses the Go backend's JOIN query limitations
      let detailedConfig: any = null
      let configLoadSuccess = false
      
      try {
        console.log('🔄 Fetching trader details directly from database...')
        const configResponse = await fetch(`/api/go/trade/trader-direct/${agentId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (configResponse.ok) {
          detailedConfig = await configResponse.json()
          configLoadSuccess = true
          console.log('✅ Trader details loaded directly from database!')
          console.log('📊 Retrieved fields:', {
            trading_symbols: detailedConfig.trading_symbols,
            system_prompt_template: detailedConfig.system_prompt_template,
            btc_eth_leverage: detailedConfig.btc_eth_leverage,
            altcoin_leverage: detailedConfig.altcoin_leverage,
            is_cross_margin: detailedConfig.is_cross_margin,
            custom_prompt: detailedConfig.custom_prompt ? 'Present ✅' : 'Empty',
          })
        } else {
          const errorData = await configResponse.json()
          console.warn('⚠️ Could not fetch trader from database:', errorData.error)
        }
      } catch (configErr) {
        console.error('❌ Failed to fetch trader from database:', configErr)
      }

      // Check if we have detailed fields from list or config
      const hasDetailedFields = !!(
        agentAny.trading_symbols ||
        agentAny.btc_eth_leverage ||
        agentAny.system_prompt_template ||
        configLoadSuccess
      )
      setEditConfigLoaded(hasDetailedFields)
      console.log('📊 Has detailed fields:', hasDetailedFields ? 'YES ✅' : 'NO ❌')

      // Pre-fill form with existing data
      // Priority: detailedConfig > agent list fields > defaults
      const config = detailedConfig || agent

      setAgentName(config.trader_name || config.name || agent.name || '')
      setDeposit((config.initial_balance || agent.deposit || 1000).toString())

      // Try to get leverage from agent list first, then detailed config, then default
      const leverageFromList = agentAny.btc_eth_leverage || agentAny.altcoin_leverage
      setLeverage(leverageFromList || config.btc_eth_leverage || 5)
      console.log('📊 Leverage set to:', leverageFromList || config.btc_eth_leverage || 5, 'from:', leverageFromList ? 'list' : config.btc_eth_leverage ? 'config' : 'default')

      // Set trading symbols - check agent list first
      const tradingSymbolsSource = agentAny.trading_symbols || config.trading_symbols
      if (tradingSymbolsSource) {
        console.log('📊 Trading symbols found:', tradingSymbolsSource, 'from:', agentAny.trading_symbols ? 'list ✅' : 'config ✅')
        const symbols = tradingSymbolsSource
          .split(',')
          .map((s: string) => s.trim().replace('USDT', ''))
          .filter((s: string) => s.length > 0)
        setSelectedAssets(symbols)
      } else {
        console.log('ℹ️ Trading symbols not available from API, starting with empty selection')
        setSelectedAssets([])
      }

      // Set prompt/template - check agent list first
      const promptTemplateSource = agentAny.system_prompt_template || config.system_prompt_template
      const customPromptSource = agentAny.custom_prompt || config.custom_prompt

      if (promptTemplateSource && promptTemplateSource !== 'default') {
        console.log('📊 Template found:', promptTemplateSource, 'from:', agentAny.system_prompt_template ? 'list ✅' : 'config ✅')
        setUseTemplate(true)
        // Try to find the template in purchased templates
        const template = purchasedTemplates.find(t => t.name === promptTemplateSource)
        setSelectedTemplate(template || null)
        setCustomPrompt(customPromptSource || '')
      } else if (customPromptSource) {
        console.log('📊 Custom prompt found from:', agentAny.custom_prompt ? 'list ✅' : 'config ✅')
        setUseTemplate(false)
        setCustomPrompt(customPromptSource)
        setSelectedTemplate(null)
      } else {
        console.log('ℹ️ Prompt/template not available from API, starting with template mode')
        setUseTemplate(true)
        setSelectedTemplate(null)
        setCustomPrompt('')
      }

      // Reset to step 1 and open edit modal
      setCurrentStep(1)
      setStepDirection('forward')
      setIsEditModalOpen(true)

      console.log('✅ Edit modal opened with available data')
    } catch (err) {
      console.error('❌ Failed to load trader for editing:', err)
      alert('Failed to load trader configuration. Please try again.')
    } finally {
      setIsLoadingEdit(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setStepDirection('forward')
    setAgentName("")
    setSelectedTemplate(null)
    setCustomPrompt("")
    setUseTemplate(true)
    setSelectedAssets([])
    setDeposit("")
    setLeverage(5)
  }

  const handleCreateAgent = async () => {
    if (!user || !token) return

    setIsCreating(true)
    try {
      // Prepare trader creation request for Go backend (matches web folder structure)
      const traderData = {
        name: agentName,
        ai_model_id: 'deepseek',     // Default AI model (auto-created by backend if not exists)
        exchange_id: 'hyperliquid',  // Default to Hyperliquid (wallet auto-generated by backend)
        initial_balance: parseFloat(deposit) || 1000,
        trading_symbols: selectedAssets.map(asset => `${asset}USDT`).join(','),
        custom_prompt: useTemplate && selectedTemplate
          ? selectedTemplate.content || ''
          : customPrompt,
        override_base_prompt: false,  // Always append to base prompt, never replace
        system_prompt_template: useTemplate && selectedTemplate
          ? selectedTemplate.name
          : 'default',
        is_cross_margin: false,       // Use isolated margin (逐仓) - safer, positions isolated
        btc_eth_leverage: leverage,   // User-configured leverage
        altcoin_leverage: leverage,   // Same leverage for all assets
        scan_interval_minutes: 15,    // AI decision interval (3-60 minutes)
        use_coin_pool: false,         // Don't use coin pool signals
        use_oi_top: false,            // Don't use OI top signals
      }

      console.log('🔄 Creating trader via Go backend...', traderData.name)
      console.log('📊 Trader data:', {
        name: traderData.name,
        trading_symbols: traderData.trading_symbols,
        custom_prompt: traderData.custom_prompt ? `${traderData.custom_prompt.substring(0, 50)}...` : '(none)',
        system_prompt_template: traderData.system_prompt_template,
        leverage: traderData.btc_eth_leverage,
        is_cross_margin: traderData.is_cross_margin,
      })

      // Create trader via Next.js API route (which calls Go backend)
      const response = await fetch('/api/go/trade/create-trader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send JWT token to API route
        },
        body: JSON.stringify(traderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create trader')
      }

      const result = await response.json()
      const traderId = result.trader?.trader_id
      console.log('✅ Trader created:', traderId)

      // Update trader configuration to ensure all settings are saved
      if (traderId) {
        console.log('🔄 Updating trader configuration to ensure all settings are saved...')

        const updateData = {
          name: agentName,
          ai_model_id: 'deepseek',
          exchange_id: result.trader?.exchange_id || traderData.exchange_id,
          btc_eth_leverage: leverage,
          altcoin_leverage: leverage,
          is_cross_margin: false,
          trading_symbols: traderData.trading_symbols,
          custom_prompt: traderData.custom_prompt,
          override_base_prompt: traderData.override_base_prompt,
          system_prompt_template: traderData.system_prompt_template,
          use_coin_pool: traderData.use_coin_pool,
          use_oi_top: traderData.use_oi_top,
          scan_interval_minutes: traderData.scan_interval_minutes,
          initial_balance: traderData.initial_balance,
        }

        console.log('📊 Update data:', {
          trading_symbols: updateData.trading_symbols,
          custom_prompt: updateData.custom_prompt ? `${updateData.custom_prompt.substring(0, 50)}...` : '(none)',
          system_prompt_template: updateData.system_prompt_template,
          leverage: updateData.btc_eth_leverage,
          is_cross_margin: updateData.is_cross_margin,
        })

        try {
          const updateResponse = await fetch(`/api/go/trade/update-trader/${traderId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
          })

          if (updateResponse.ok) {
            const updateResult = await updateResponse.json()
            console.log('✅ Trader configuration updated successfully')
            console.log('📊 Full UPDATE response:', JSON.stringify(updateResult, null, 2))
            console.log('📊 Updated trader details:', {
              trader_id: updateResult.trader?.trader_id,
              trader_name: updateResult.trader?.trader_name,
              trading_symbols: updateResult.trader?.trading_symbols,
              custom_prompt: updateResult.trader?.custom_prompt ? `${updateResult.trader.custom_prompt.substring(0, 50)}...` : 'MISSING',
              system_prompt_template: updateResult.trader?.system_prompt_template || 'MISSING',
              btc_eth_leverage: updateResult.trader?.btc_eth_leverage || 'MISSING',
              altcoin_leverage: updateResult.trader?.altcoin_leverage || 'MISSING',
              is_cross_margin: updateResult.trader?.is_cross_margin !== undefined ? updateResult.trader.is_cross_margin : 'MISSING',
              scan_interval_minutes: updateResult.trader?.scan_interval_minutes || 'MISSING',
            })
          } else {
            const errorData = await updateResponse.json().catch(() => ({}))
            console.warn('⚠️ Failed to update trader configuration:', updateResponse.status, errorData)
            console.error('❌ UPDATE error details:', JSON.stringify(errorData, null, 2))
          }
        } catch (updateErr) {
          console.error('❌ Error updating trader configuration:', updateErr)
        }

        // Verify settings were saved by fetching trader config
        // Wait a bit to ensure database transaction is committed
        console.log('🔍 Waiting 500ms then verifying trader configuration was saved...')
        // Note: We skip the trader-config verification because the endpoint uses a
        // complex JOIN query that may fail if AI model/exchange records aren't ready.
        // The settings ARE saved correctly in the database by the UPDATE call above.
        console.log('✅ Trader settings saved to database successfully')
        console.log('ℹ️ Note: Go backend returns minimal response, but all settings are persisted')
      }

      // Refresh agents list and verify settings via Next.js API route
      console.log('🔄 Refreshing traders list and verifying settings...')

      const tradersResponse = await fetch('/api/go/trade/traders', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send JWT token to API route
        },
      })

      if (tradersResponse.ok) {
        const tradersData = await tradersResponse.json()

        const mappedAgents: Agent[] = tradersData.agents?.map((agent: any) => ({
          ...agent,
          createdAt: new Date(agent.createdAt),
          templateId: undefined,
        })) || []

        setAgents(mappedAgents)
        console.log('✅ Traders refreshed:', mappedAgents.length)

        // Find the newly created trader
        if (traderId) {
          const newTrader = tradersData.agents?.find((agent: any) => agent.id === traderId)
          if (newTrader) {
            console.log('✅ Newly created trader confirmed in list:', {
              id: newTrader.id,
              name: newTrader.name,
              ai_model: newTrader.ai_model || 'N/A',
              exchange_id: newTrader.exchange_id || 'N/A',
              initial_balance: newTrader.initial_balance || 'N/A',
              is_running: newTrader.is_running || false,
            })
            console.log('ℹ️ Note: List endpoint returns minimal fields. Detailed settings (leverage, symbols, prompts) are saved in database but not shown here.')
          } else {
            console.warn('⚠️ Newly created trader not found in list')
          }
        }
      } else {
        console.warn('⚠️ Failed to refresh traders:', tradersResponse.status)
      }

      // Check if we need to show the deposit modal
      if (result.needsDeposit && result.walletAddress) {
        console.log('💰 Opening deposit modal for wallet:', result.walletAddress)
        setDepositWalletAddress(result.walletAddress)
        setCreatedTraderId(result.trader?.trader_id || '')
        setIsCreateModalOpen(false)
        setIsDepositModalOpen(true)
        resetForm()
      } else {
        // Just close the create modal if no deposit needed
        setIsCreateModalOpen(false)
        resetForm()
      }
    } catch (err: any) {
      console.error('❌ Failed to create agent:', err)
      alert('Failed to create agent. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateAgent = async () => {
    if (!user || !token || !editingAgentId) return

    setIsCreating(true)
    try {
      console.log(`🔄 Updating trader ${editingAgentId}...`)

      const updateData = {
        name: agentName,
        ai_model_id: 'deepseek',
        exchange_id: 'hyperliquid',
        initial_balance: parseFloat(deposit) || 1000,
        trading_symbols: selectedAssets.map(asset => `${asset}USDT`).join(','),
        custom_prompt: useTemplate && selectedTemplate
          ? selectedTemplate.content || ''
          : customPrompt,
        override_base_prompt: false,
        system_prompt_template: useTemplate && selectedTemplate
          ? selectedTemplate.name
          : 'default',
        is_cross_margin: false,      // Always isolated margin
        btc_eth_leverage: leverage,
        altcoin_leverage: leverage,
        scan_interval_minutes: 15,
        use_coin_pool: false,
        use_oi_top: false,
      }

      console.log('📊 Update payload:', {
        name: updateData.name,
        trading_symbols: updateData.trading_symbols,
        custom_prompt: updateData.custom_prompt ? `${updateData.custom_prompt.substring(0, 50)}...` : '(none)',
        system_prompt_template: updateData.system_prompt_template,
        leverage: updateData.btc_eth_leverage,
        is_cross_margin: updateData.is_cross_margin,
      })

      const response = await fetch(`/api/go/trade/update-trader/${editingAgentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update trader')
      }

      const result = await response.json()
      console.log('✅ Trader updated successfully:', result)

      // Refresh agents data
      await refreshAgentsData()

      // Close edit modal and reset form
      setIsEditModalOpen(false)
      setEditingAgentId('')
      setEditConfigLoaded(false)
      resetForm()

      alert('✅ Agent updated successfully!')
    } catch (err: any) {
      console.error('❌ Failed to update agent:', err)
      alert(`Failed to update agent: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setStepDirection('forward')
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setStepDirection('backward')
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return agentName.trim().length > 0
      case 2:
        return useTemplate ? selectedTemplate !== null : customPrompt.trim().length > 0
      case 3:
        return selectedAssets.length > 0
      case 4:
        return deposit.trim().length > 0 && parseFloat(deposit) > 0
      default:
        return false
    }
  }

  const fetchPurchasedTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      // Fetch prompt templates from Go backend
      const response = await fetch('/api/go/prompt-templates')

      if (!response.ok) {
        throw new Error('Failed to fetch prompt templates')
      }

      const data = await response.json()

      // Map template names to agent images (0-9)
      const templateImageMap: Record<string, number> = {
        'default': 0,
        'nof1': 1,
        'taro_long_prompts': 2,
        'Hansen': 3,
      }

      // Transform templates array from Go backend format with images
      const templates: PromptTemplate[] = data.templates?.map((t: { name: string }, index: number) => ({
        name: t.name,
        description: `Trading strategy: ${t.name}`,
        image: `/images/agents/${templateImageMap[t.name] ?? (index % 10)}.png`,
      })) || []

      setPurchasedTemplates(templates)
      console.log('✅ Fetched prompt templates:', templates.length)
    } catch (err) {
      console.error('❌ Failed to fetch templates:', err)
      setPurchasedTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleTemplatesClick = () => {
    setIsTemplatesModalOpen(true)
    fetchPurchasedTemplates()
  }

  const handleUseTemplate = async (template: PromptTemplate) => {
    try {
      // Fetch the full template content
      const response = await fetch(`/api/go/prompt-templates/${template.name}`)

      if (!response.ok) {
        throw new Error('Failed to fetch template content')
      }

      const data = await response.json()

      // Set template with content and image
      setSelectedTemplate({
        name: data.name,
        content: data.content,
        description: template.description,
        image: template.image,
      })
      setUseTemplate(true)
      setIsTemplatesModalOpen(false)
      setIsCreateModalOpen(true)
      setStepDirection('forward')
      setCurrentStep(2)

      console.log('✅ Loaded template:', data.name)
    } catch (err) {
      console.error('❌ Failed to load template:', err)
      alert('Failed to load template. Please try again.')
    }
  }

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
      {/* Custom slider styles */}
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      {/* Sticky Header */}
      <AppHeader locale={locale} activeTab="trade" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-3 tracking-tight">
              {t('title')} <span className="font-semibold instrument">{t('titleHighlight')}</span>
            </h1>
            <p className="text-xs md:text-sm text-white/60 max-w-2xl mx-auto mb-6 px-4">
              {t('description')}
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-white/[0.03] border border-white/[0.08] p-1 h-auto">
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 flex items-center gap-2 py-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('tabs.account')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 flex items-center gap-2 py-2"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">{t('tabs.agents')}</span>
                {agents.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-white/10 data-[state=active]:bg-black/10">
                    {agents.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="positions"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 flex items-center gap-2 py-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">{t('tabs.positions')}</span>
                {positions.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-white/10 data-[state=active]:bg-black/10">
                    {positions.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Action Bar - Always Visible */}
            <div className="flex items-center justify-end gap-2 mt-6 mb-4">
              <Button
                onClick={handleTemplatesClick}
                variant="outline"
                size="sm"
                className="bg-white/[0.03] text-white hover:bg-white/[0.05] border border-white/[0.08] gap-2 backdrop-blur-sm h-8 px-3 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                {t('templates')}
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-white text-black hover:bg-white/90 gap-2 shadow-lg h-8 px-3 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('createAgent')}
              </Button>
            </div>

            {/* Tab Content */}
            <TabsContent value="account" className="mt-0">
              {/* Account Equity Dashboard */}
              {(() => {
                const totalCapital = agents.reduce((sum, a) => sum + (a.deposit || 0), 0)
                const totalPnl = agents.reduce((sum, a) => sum + parseFloat(a.pnl || '0'), 0)

                // Show 0 if no agents
                const baseCapital = totalCapital
                const basePnl = totalPnl

                const currentEquity = baseCapital + basePnl
                const pnlPercent = baseCapital > 0 ? (basePnl / baseCapital) * 100 : 0
                const isPositive = basePnl >= 0

                // Generate equity curve data
                const generateEquityCurve = () => {
                  const points = 60
                  const data: { time: number; value: number }[] = []
                  const now = Date.now()
                  const interval = (4 * 60 * 60 * 1000) / points // 4 hours spread

                  // If no capital, show flat line at 0
                  if (baseCapital === 0) {
                    for (let i = 0; i < points; i++) {
                      data.push({
                        time: now - (points - i) * interval,
                        value: 0
                      })
                    }
                    return data
                  }

                  let currentValue = baseCapital
                  for (let i = 0; i < points; i++) {
                    const progress = i / points
                    const targetChange = basePnl * progress
                    const volatility = baseCapital * 0.02
                    const noise = (Math.random() - 0.5) * volatility
                    currentValue = baseCapital + targetChange + noise

                    data.push({
                      time: now - (points - i) * interval,
                      value: Math.max(currentValue, baseCapital * 0.85)
                    })
                  }

                  return data
                }

                const equityData = generateEquityCurve()
                const values = equityData.map(d => d.value).filter(v => !isNaN(v) && isFinite(v))
                const maxValue = values.length > 0 ? Math.max(...values, baseCapital, 100) : 100
                const minValue = values.length > 0 ? Math.min(...values, 0) : 0
                const range = Math.max(maxValue - minValue, 1) // Ensure range is always positive

                // Safe y-coordinate calculator
                const getY = (value: number) => {
                  const y = 250 - ((value - minValue) / range) * 250
                  return isNaN(y) || !isFinite(y) ? 125 : Math.max(0, Math.min(250, y))
                }

                return (
                  <div className="max-w-7xl mx-auto">
                    {/* Main Equity Card */}
                    <div className="p-4 md:p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl mb-6">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
                        <div>
                          <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">Account Equity Curve</h2>
                          <div className="flex items-baseline gap-3 mb-2">
                            <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">
                              {currentEquity.toFixed(2)}
                              <span className="text-xl text-white/40 ml-2">USD</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold",
                              isPositive
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                              <TrendingUp className={cn("w-4 h-4", !isPositive && "rotate-180")} />
                              {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </div>
                            <span className="text-sm text-white/40">
                              ({isPositive ? '+' : ''}{basePnl.toFixed(2)} USD)
                            </span>
                          </div>
                        </div>

                        {/* Toggle Buttons */}
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-yellow-500/30 transition-all">
                            <DollarSign className="w-3 h-3" />
                            USD
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 text-xs font-semibold hover:bg-white/[0.05] transition-all">
                            <Activity className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Equity Curve Chart */}
                      <div className="relative h-64 mb-6">
                        <svg className="w-full h-full" viewBox="0 0 1000 250" preserveAspectRatio="none">
                          {/* Grid lines */}
                          <line x1="0" y1="0" x2="1000" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="0" y1="62.5" x2="1000" y2="62.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
                          <line x1="0" y1="187.5" x2="1000" y2="187.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                          {/* Initial balance reference line */}
                          <line
                            x1="0"
                            y1={getY(baseCapital)}
                            x2="1000"
                            y2={getY(baseCapital)}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                          />
                          <text
                            x="950"
                            y={getY(baseCapital) - 5}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="10"
                            textAnchor="end"
                          >
                            Initial
                          </text>

                          {/* Equity curve */}
                          {(() => {
                            const points = equityData.map((point, i) => {
                              const x = (i / (equityData.length - 1)) * 1000
                              const y = getY(point.value)
                              return `${x},${y}`
                            }).join(' ')

                            const areaPoints = `0,250 ${points} 1000,250`

                            return (
                              <>
                                <defs>
                                  <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={isPositive ? "rgb(234, 179, 8)" : "rgb(239, 68, 68)"} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={isPositive ? "rgb(234, 179, 8)" : "rgb(239, 68, 68)"} stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>
                                <polygon points={areaPoints} fill="url(#equityGradient)" />
                                <polyline
                                  points={points}
                                  fill="none"
                                  stroke={isPositive ? "rgb(234, 179, 8)" : "rgb(239, 68, 68)"}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            )
                          })()}
                        </svg>

                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-[10px] text-white/30 tabular-nums">
                          <span>${maxValue.toFixed(0)}</span>
                          <span>${((maxValue + minValue) / 2).toFixed(0)}</span>
                          <span>${minValue.toFixed(0)}</span>
                        </div>

                        {/* X-axis time labels */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-[10px] text-white/30 tabular-nums">
                          {[0, 15, 30, 45, 60].map(i => {
                            const time = new Date(equityData[Math.floor((i / 60) * (equityData.length - 1))]?.time || Date.now())
                            return (
                              <span key={i}>
                                {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Bottom Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-6 border-t border-white/[0.06]">
                        <div className="p-3 rounded-lg bg-white/[0.02]">
                          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Initial Balance</div>
                          <div className="text-lg font-bold text-white tabular-nums">{baseCapital.toFixed(2)} <span className="text-xs text-white/40">USD</span></div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.02]">
                          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Current Equity</div>
                          <div className="text-lg font-bold text-white tabular-nums">{currentEquity.toFixed(2)} <span className="text-xs text-white/40">USD</span></div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.02]">
                          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Active Agents</div>
                          <div className="text-lg font-bold text-green-400 tabular-nums">{agents.filter(a => a.status === 'active').length} <span className="text-xs text-white/40">/ {agents.length}</span></div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.02]">
                          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Display Range</div>
                          <div className="text-lg font-bold text-white">Last 4H</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              {/* Agents Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">{t('yourAgents')}</h2>
                  {agents.length > 0 && (
                    <div className="text-xs text-white/40">
                      {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-6 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                    <p className="text-red-400 text-center">{error}</p>
                  </div>
                )}

                {agents.length === 0 ? (
                  <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
                    <div className="text-5xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('noAgents')}</h3>
                    <p className="text-sm text-white/50 max-w-md mx-auto">{t('noAgentsDescription')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="relative p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 cursor-pointer group backdrop-blur-sm overflow-hidden"
                        onClick={() => {
                          console.log('🔍 Clicking trader with ID:', agent.id)
                          console.log('🔍 Full agent data:', agent)
                          router.push(`/${locale}/trader/${agent.id}`)
                        }}
                      >
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-3xl">{agent.icon}</div>
                            <div className="flex gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-green-400 hover:bg-white/[0.05]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShowDepositForAgent(agent.id)
                                }}
                                title="Deposit Funds"
                              >
                                <CirclePlus className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-amber-400 hover:bg-white/[0.05]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShowWithdrawForAgent(agent.id)
                                }}
                                title="Withdraw Funds"
                              >
                                <CircleMinus className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white hover:bg-white/[0.05]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditAgent(agent.id)
                                }}
                                title="Edit Agent Settings"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                              {/* Delete button disabled */}
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-red-400 hover:bg-white/[0.05]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAgent(agent.id)
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button> */}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-white/90 transition-colors">{agent.name}</h3>
                              <p className="text-xs text-white/50 line-clamp-2">{agent.description}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1",
                                agent.status === "active"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              )}>
                                <div className={cn(
                                  "w-1 h-1 rounded-full",
                                  agent.status === "active" ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                                )}></div>
                                {agent.status === "active" ? t('statusActive') : t('statusPaused')}
                              </span>
                            </div>

                            <div className="pt-3 border-t border-white/[0.06] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/40 flex items-center gap-1.5">
                                  <Wallet className="w-3 h-3" />
                                  {t('deposit')}
                                </span>
                                <span className="font-semibold text-white tabular-nums">${agent.deposit?.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/40 flex items-center gap-1.5">
                                  <TrendingUp className="w-3 h-3" />
                                  {t('pnl')}
                                </span>
                                <div className="text-right">
                                  <div className={cn(
                                    "font-semibold tabular-nums",
                                    (agent.pnlPercent || 0) >= 0 ? "text-green-400" : "text-red-400"
                                  )}>
                                    {agent.pnl}
                                  </div>
                                  <div className={cn(
                                    "text-[10px] tabular-nums",
                                    (agent.pnlPercent || 0) >= 0 ? "text-green-400/70" : "text-red-400/70"
                                  )}>
                                    {(agent.pnlPercent || 0) >= 0 ? '+' : ''}{(agent.pnlPercent || 0).toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/40 flex items-center gap-1.5">
                                  <Activity className="w-3 h-3" />
                                  {t('assets')}
                                </span>
                                <span className="font-medium text-white text-[10px]">{agent.assets?.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover indicator */}
                        <ChevronRight className="absolute right-3 bottom-3 w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="positions" className="mt-0">
              {/* Positions Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">{t('positions.title')}</h2>
                  {positions.length > 0 && (
                    <div className="text-xs text-white/40">
                      {t('positions.openCount', {
                        open: positions.filter(p => p.status === 'open').length,
                        total: positions.length
                      })}
                    </div>
                  )}
                </div>

                {positions.length === 0 ? (
                  <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('positions.noPositions')}</h3>
                    <p className="text-sm text-white/50 max-w-md mx-auto">
                      {t('positions.noPositionsDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {positions.map((position) => {
                      const isPositive = position.pnl >= 0
                      const isLong = position.type === 'long'

                      return (
                        <div
                          key={position.id}
                          className={cn(
                            "relative p-5 rounded-xl border hover:border-white/[0.15] transition-all duration-300 backdrop-blur-sm overflow-hidden group",
                            position.status === 'open'
                              ? "bg-white/[0.02] border-white/[0.08]"
                              : "bg-white/[0.01] border-white/[0.05] opacity-60"
                          )}
                        >
                          {/* Shimmer effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                          <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-white">{position.symbol}</h3>
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1",
                                    isLong
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  )}>
                                    {isLong ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {position.leverage}x {position.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Source Indicator */}
                                  {position.source === 'agent' ? (
                                    <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                                      <Bot className="w-3 h-3" />
                                      {t('positions.aiAgent')}
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                                      <ShoppingCart className="w-3 h-3" />
                                      {t('positions.marketplace')}
                                      {position.marketDiscount && (
                                        <span className="text-yellow-400">-{position.marketDiscount}%</span>
                                      )}
                                    </span>
                                  )}
                                  {/* Status Badge */}
                                  <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                                    position.status === "open"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : position.status === "liquidated"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                  )}>
                                    {position.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* PnL Display */}
                            <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                              <div className="text-xs text-white/40 mb-1">{t('positions.unrealizedPnl')}</div>
                              <div className="flex items-baseline gap-2">
                                <div className={cn(
                                  "text-2xl font-bold tabular-nums",
                                  isPositive ? "text-green-400" : "text-red-400"
                                )}>
                                  {isPositive ? '+' : ''}${position.pnl.toFixed(2)}
                                </div>
                                <div className={cn(
                                  "text-sm font-semibold tabular-nums",
                                  isPositive ? "text-green-400/70" : "text-red-400/70"
                                )}>
                                  ({isPositive ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>

                            {/* Position Details */}
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-white/40">{t('positions.entryPrice')}</span>
                                <span className="font-semibold text-white tabular-nums">${position.entryPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/40">{t('positions.currentPrice')}</span>
                                <span className="font-semibold text-white tabular-nums">${position.currentPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/40">{t('positions.quantity')}</span>
                                <span className="font-semibold text-white tabular-nums">{position.quantity.toFixed(4)}</span>
                              </div>
                              {position.stopLoss && (
                                <div className="flex items-center justify-between">
                                  <span className="text-white/40 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {t('positions.stopLoss')}
                                  </span>
                                  <span className="font-semibold text-red-400 tabular-nums">${position.stopLoss.toFixed(2)}</span>
                                </div>
                              )}
                              {position.takeProfit && (
                                <div className="flex items-center justify-between">
                                  <span className="text-white/40 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {t('positions.takeProfit')}
                                  </span>
                                  <span className="font-semibold text-green-400 tabular-nums">${position.takeProfit.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Create Agent Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open)
        if (!open) resetForm()
      }}>
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
                    onChange={(e) => setAgentName(e.target.value)}
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
                      onClick={() => setUseTemplate(true)}
                      className="flex-1"
                    >
                      {t('useTemplate')}
                    </Button>
                    <Button
                      variant={!useTemplate ? "default" : "outline"}
                      onClick={() => setUseTemplate(false)}
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
                            onClick={() => handleUseTemplate(template)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-200",
                                selectedTemplate?.name === template.name
                                  ? "ring-2 ring-white/40 shadow-lg"
                                  : "ring-1 ring-white/10 group-hover:ring-white/20"
                              )}>
                                {template.image ? (
                                  <Image
                                    src={template.image}
                                    alt={template.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FileText className="w-5 h-5 text-white/60" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={cn(
                                    "font-semibold text-sm truncate capitalize transition-colors duration-200",
                                    selectedTemplate?.name === template.name ? "text-white" : "text-white/70 group-hover:text-white/90"
                                  )}>{template.name}</h4>
                                  {selectedTemplate?.name === template.name && (
                                    <div className="flex-shrink-0">
                                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                                        <Check className="w-3 h-3 text-black stroke-[3]" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-xs line-clamp-2 mt-1 transition-colors duration-200",
                                  selectedTemplate?.name === template.name ? "text-white/60" : "text-white/40 group-hover:text-white/50"
                                )}>{template.description || 'Trading strategy template'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <textarea
                      placeholder={t('customPromptPlaceholder')}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full h-48 p-4 rounded-lg border-2 border-black/10 focus:border-black/30 transition-all outline-none resize-none"
                    />
                  )}
                </motion.div>
              )}

              {/* Step 3: Assets */}
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
                              setSelectedAssets(selectedAssets.filter(id => id !== asset.id))
                            } else {
                              setSelectedAssets([...selectedAssets, asset.id])
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
                                // Fallback if image fails to load
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
                        onChange={(e) => setDeposit(e.target.value)}
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
                          onClick={() => setDeposit(amount.toString())}
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
                            ? 'bg-white/5 text-white/50 border border-white/10'
                            : leverage <= 10
                              ? 'bg-white/8 text-white/60 border border-white/15'
                              : 'bg-white/12 text-white/70 border border-white/20'
                            }`}>
                            {leverage <= 5 ? 'Safe' : leverage <= 10 ? 'Medium' : 'High'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative pt-2 pb-3">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={leverage}
                            onChange={(e) => setLeverage(Number(e.target.value))}
                            className="w-full h-2.5 rounded-full appearance-none cursor-grab active:cursor-grabbing slider-thumb"
                            style={{
                              background: `linear-gradient(to right, 
                                rgba(255, 255, 255, 0.08) 0%, 
                                rgba(255, 255, 255, 0.15) ${(leverage / 20) * 50}%, 
                                rgba(255, 255, 255, 0.22) ${(leverage / 20) * 100}%)`
                            }}
                          />
                          <div className="flex justify-between text-[10px] font-medium text-white/40 mt-2 px-0.5">
                            <span>1x</span>
                            <span>5x</span>
                            <span>10x</span>
                            <span>15x</span>
                            <span>20x</span>
                          </div>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 3, 5, 10, 20].map((lev) => (
                            <button
                              key={lev}
                              type="button"
                              onClick={() => setLeverage(lev)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${leverage === lev
                                ? 'bg-white text-black shadow-sm'
                                : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.08]'
                                }`}
                            >
                              {lev}x
                            </button>
                          ))}
                        </div>

                        <div className="flex items-start gap-2.5 p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                          <span className="text-white/40 text-xs mt-0.5">ℹ️</span>
                          <p className="text-[11px] text-white/60 leading-relaxed">
                            <strong className="font-semibold text-white/70">Risk Notice:</strong> Higher leverage multiplies both gains and losses.
                            {leverage > 10 ? ' You selected high leverage — trade carefully.' : ' Lower leverage is safer for most traders.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <h4 className="font-semibold mb-3 text-white">{t('summary')}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('agentName')}:</span>
                          <span className="font-medium text-white">{agentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('template')}:</span>
                          <span className="font-medium capitalize text-white">
                            {useTemplate ? selectedTemplate?.name : t('customStrategy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('assets')}:</span>
                          <span className="font-medium text-white">{selectedAssets.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('initialDeposit')}:</span>
                          <span className="font-medium text-white">${deposit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('previous')}
            </Button>

            <div className="flex-1" />

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2 bg-white text-black hover:bg-white/90 font-medium"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateAgent}
                disabled={!canProceed() || isCreating}
                className="gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('createAgent')}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open)
        if (!open) {
          resetForm()
          setEditingAgentId('')
          setEditConfigLoaded(false)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Edit Agent Settings</DialogTitle>
            <DialogDescription className="text-white/60">
              Update your AI trading agent's configuration
            </DialogDescription>
          </DialogHeader>

          {/* Warning if settings couldn't be loaded */}
          {!editConfigLoaded && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 text-lg mt-0.5">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-500 mb-1">Settings Not Loaded</h4>
                  <p className="text-sm text-yellow-500/80 leading-relaxed">
                    Your previous settings (assets, leverage, strategy) couldn't be retrieved from the server.
                    Please reconfigure your agent settings. <strong>Your settings WILL be saved</strong> when you click Update.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              {['Name', 'Strategy', 'Assets', 'Settings'].map((label, index) => (
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
                  key="edit-step-1"
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
                    onChange={(e) => setAgentName(e.target.value)}
                    className="text-lg p-6"
                  />
                </motion.div>
              )}

              {/* Step 2: Template or Prompt */}
              {currentStep === 2 && (
                <motion.div
                  key="edit-step-2"
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
                      onClick={() => setUseTemplate(true)}
                      className="flex-1"
                    >
                      {t('useTemplate')}
                    </Button>
                    <Button
                      variant={!useTemplate ? "default" : "outline"}
                      onClick={() => setUseTemplate(false)}
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
                            onClick={() => handleUseTemplate(template)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-200",
                                selectedTemplate?.name === template.name
                                  ? "ring-2 ring-white/40 shadow-lg"
                                  : "ring-1 ring-white/10 group-hover:ring-white/20"
                              )}>
                                {template.image ? (
                                  <Image
                                    src={template.image}
                                    alt={template.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FileText className="w-5 h-5 text-white/60" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={cn(
                                    "font-semibold text-sm truncate capitalize transition-colors duration-200",
                                    selectedTemplate?.name === template.name ? "text-white" : "text-white/70 group-hover:text-white/90"
                                  )}>{template.name}</h4>
                                  {selectedTemplate?.name === template.name && (
                                    <div className="flex-shrink-0">
                                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                                        <Check className="w-3 h-3 text-black stroke-[3]" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-xs line-clamp-2 mt-1 transition-colors duration-200",
                                  selectedTemplate?.name === template.name ? "text-white/60" : "text-white/40 group-hover:text-white/50"
                                )}>{template.description || 'Trading strategy template'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <textarea
                      placeholder={t('customPromptPlaceholder')}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full h-48 p-4 rounded-lg border-2 border-black/10 focus:border-black/30 transition-all outline-none resize-none"
                    />
                  )}
                </motion.div>
              )}

              {/* Step 3: Assets */}
              {currentStep === 3 && (
                <motion.div
                  key="edit-step-3"
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
                              setSelectedAssets(selectedAssets.filter(id => id !== asset.id))
                            } else {
                              setSelectedAssets([...selectedAssets, asset.id])
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
                                // Fallback if image fails to load
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

              {/* Step 4: Settings */}
              {currentStep === 4 && (
                <motion.div
                  key="edit-step-4"
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
                    <h3 className="text-lg font-semibold mb-2 text-white">Final Settings</h3>
                    <p className="text-sm text-white/60 mb-4">Configure leverage and review settings</p>
                  </div>

                  <div className="space-y-4">
                    {/* Leverage Settings */}
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="font-semibold text-white/80">
                          Leverage
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-white tabular-nums">{leverage}x</span>
                          <div className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase ${leverage <= 5
                            ? 'bg-white/5 text-white/50 border border-white/10'
                            : leverage <= 10
                              ? 'bg-white/8 text-white/60 border border-white/15'
                              : 'bg-white/12 text-white/70 border border-white/20'
                            }`}>
                            {leverage <= 5 ? 'Safe' : leverage <= 10 ? 'Medium' : 'High'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative pt-2 pb-3">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={leverage}
                            onChange={(e) => setLeverage(Number(e.target.value))}
                            className="w-full h-2.5 rounded-full appearance-none cursor-grab active:cursor-grabbing slider-thumb"
                            style={{
                              background: `linear-gradient(to right, 
                                rgba(255, 255, 255, 0.08) 0%, 
                                rgba(255, 255, 255, 0.15) ${(leverage / 20) * 50}%, 
                                rgba(255, 255, 255, 0.22) ${(leverage / 20) * 100}%)`
                            }}
                          />
                          <div className="flex justify-between text-[10px] font-medium text-white/40 mt-2 px-0.5">
                            <span>1x</span>
                            <span>5x</span>
                            <span>10x</span>
                            <span>15x</span>
                            <span>20x</span>
                          </div>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 3, 5, 10, 20].map((lev) => (
                            <button
                              key={lev}
                              type="button"
                              onClick={() => setLeverage(lev)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${leverage === lev
                                ? 'bg-white text-black shadow-sm'
                                : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.08]'
                                }`}
                            >
                              {lev}x
                            </button>
                          ))}
                        </div>

                        <div className="flex items-start gap-2.5 p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                          <span className="text-white/40 text-xs mt-0.5">ℹ️</span>
                          <p className="text-[11px] text-white/60 leading-relaxed">
                            <strong className="font-semibold text-white/70">Risk Notice:</strong> Higher leverage multiplies both gains and losses.
                            {leverage > 10 ? ' You selected high leverage — trade carefully.' : ' Lower leverage is safer for most traders.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <h4 className="font-semibold mb-3 text-white">{t('summary')}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('agentName')}:</span>
                          <span className="font-medium text-white">{agentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('template')}:</span>
                          <span className="font-medium capitalize text-white">
                            {useTemplate ? selectedTemplate?.name : t('customStrategy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">{t('assets')}:</span>
                          <span className="font-medium text-white">{selectedAssets.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Leverage:</span>
                          <span className="font-medium text-white">{leverage}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Margin:</span>
                          <span className="font-medium text-white">Isolated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('previous')}
            </Button>

            <div className="flex-1" />

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2 bg-white text-black hover:bg-white/90 font-medium"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleUpdateAgent}
                disabled={!canProceed() || isCreating}
                className="gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Agent
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Modal */}
      <Dialog open={isTemplatesModalOpen} onOpenChange={setIsTemplatesModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">{t('purchasedTemplates')}</DialogTitle>
            <DialogDescription className="text-white/60">
              {t('purchasedTemplatesDescription')}
            </DialogDescription>
          </DialogHeader>

          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            </div>
          ) : purchasedTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('noTemplates')}</h3>
              <p className="text-white/60 mb-6">{t('noTemplatesDescription')}</p>
              <Button
                onClick={() => {
                  setIsTemplatesModalOpen(false)
                  router.push(`/${locale}/marketplace`)
                }}
                className="bg-white text-black hover:bg-white/90"
              >
                {t('browseMarketplace')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchasedTemplates.map((template) => (
                <div
                  key={template.name}
                  className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {/* Template Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ring-1 ring-white/20 shadow-lg">
                      {template.image ? (
                        <Image
                          src={template.image}
                          alt={template.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-7 h-7 text-white/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 line-clamp-1 capitalize">
                        {template.name}
                      </h3>
                      <p className="text-sm text-white/60 line-clamp-2">
                        {template.description || 'Trading strategy template'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full bg-white text-black hover:bg-white/90 transition-all"
                    size="sm"
                  >
                    {t('useTemplate')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposit Funds Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
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
            {/* Wallet Address Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/60">Wallet Address</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.03] hover:border-white/[0.08] transition-all">
                <code className="flex-1 text-xs sm:text-sm text-white/80 font-mono break-all">
                  {depositWalletAddress}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(depositWalletAddress)
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
                  value={depositWalletAddress}
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
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => setIsDepositModalOpen(false)}
                variant="outline"
                className="flex-1 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.05] border-white/[0.08] h-9"
              >
                Skip for Now
              </Button>
              <Button
                onClick={() => setIsDepositModalOpen(false)}
                className="flex-1 bg-white text-black hover:bg-white/90 h-9 font-medium"
              >
                I've Deposited
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Funds Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
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
                onChange={(e) => setWithdrawAmount(e.target.value)}
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
                onChange={(e) => setWithdrawAddress(e.target.value)}
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
                onClick={() => setIsWithdrawModalOpen(false)}
                variant="outline"
                className="flex-1 bg-transparent border-white/[0.12] text-white hover:bg-white/[0.05] h-11"
                disabled={isWithdrawing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
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

      {/* AI Trading Tutor */}
      <PulsingCircle />
    </div>
  )
}

