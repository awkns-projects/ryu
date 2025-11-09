import { NextRequest, NextResponse } from 'next/server'
import { generateEthereumWallet } from '@/lib/wallet'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface CreateTraderRequest {
  name: string
  ai_model_id: string
  exchange_id: string
  initial_balance?: number
  scan_interval_minutes?: number
  btc_eth_leverage?: number
  altcoin_leverage?: number
  trading_symbols?: string
  custom_prompt?: string
  override_base_prompt?: boolean
  system_prompt_template?: string
  is_cross_margin?: boolean
  use_coin_pool?: boolean
  use_oi_top?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header (sent from frontend)
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [API Route] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CreateTraderRequest = await request.json()

    console.log('🔄 [API Route] Creating trader...', body.name)

    // ====================================
    // 🔐 STEP 1: Auto-create DeepSeek AI Model if needed
    // ====================================
    let aiModelId = body.ai_model_id || 'deepseek'
    console.log(`🔍 Checking if AI model '${aiModelId}' exists...`)

    // Check if AI model exists (use /api/models endpoint)
    const aiModelsResponse = await fetch(`${BACKEND_URL}/api/models`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    console.log(`📡 AI models fetch status: ${aiModelsResponse.status}`)

    if (aiModelsResponse.ok) {
      const aiModelsData = await aiModelsResponse.json()
      console.log(`📊 AI models data:`, aiModelsData)

      // Response is an array directly, not wrapped in an object
      // First check if there's an AI model with this exact ID
      let existingModel = Array.isArray(aiModelsData)
        ? aiModelsData.find((m: any) => m.id === aiModelId)
        : null

      // If not found by exact ID, try to find by provider (e.g., "deepseek")
      if (!existingModel && aiModelId === 'deepseek') {
        existingModel = Array.isArray(aiModelsData)
          ? aiModelsData.find((m: any) => m.provider === 'deepseek')
          : null

        if (existingModel) {
          // Use the existing model's actual ID
          aiModelId = existingModel.id
          console.log(`✓ Found existing DeepSeek model with ID: ${aiModelId}`)
        }
      }

      console.log(`🔎 AI model '${aiModelId}' exists:`, !!existingModel)

      if (!existingModel) {
        console.log(`💡 AI model '${aiModelId}' not found, creating...`)

        // Get DeepSeek API key from environment
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY

        if (!deepseekApiKey) {
          return NextResponse.json(
            { error: 'DEEPSEEK_API_KEY environment variable is not set. Please configure it first.' },
            { status: 400 }
          )
        }

        // Create DeepSeek AI model using updateAIModelConfig
        try {
          const { updateAIModelConfig } = await import('@/lib/go-crypto')

          await updateAIModelConfig(authHeader, aiModelId, {
            enabled: true,
            api_key: deepseekApiKey,
            custom_api_url: '',
            custom_model_name: '',
          })

          console.log('✅ DeepSeek AI model created successfully')

          // Re-fetch AI models to get the actual ID that was created
          const refreshedResponse = await fetch(`${BACKEND_URL}/api/models`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
          })

          if (refreshedResponse.ok) {
            const refreshedData = await refreshedResponse.json()
            const createdModel = Array.isArray(refreshedData)
              ? refreshedData.find((m: any) => m.provider === 'deepseek')
              : null

            if (createdModel) {
              aiModelId = createdModel.id
              console.log(`✅ Using created AI model ID: ${aiModelId}`)
            }
          }
        } catch (error) {
          console.error('❌ Failed to create DeepSeek AI model:', error)
          return NextResponse.json(
            { error: `Failed to create DeepSeek AI model: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          )
        }
      } else {
        console.log(`✓ AI model '${aiModelId}' already exists`)
      }
    }

    // ====================================
    // 🔐 STEP 2: Auto-generate NEW Hyperliquid wallet for EACH trader
    // ====================================
    let walletAddress = ''
    let isNewWallet = false
    let uniqueExchangeId = body.exchange_id // Default to the original exchange_id

    if (body.exchange_id === 'hyperliquid') {
      console.log('🔑 Hyperliquid exchange detected, generating NEW wallet for this trader...')

      // ALWAYS generate a new wallet for each trader
      const wallet = generateEthereumWallet()
      console.log('✅ New wallet generated for trader:', wallet.address)

      walletAddress = wallet.address
      isNewWallet = true

      // Create a unique exchange ID for this trader (hyperliquid_<timestamp>)
      const timestamp = Math.floor(Date.now() / 1000)
      uniqueExchangeId = `hyperliquid_${timestamp}`
      console.log(`🆔 Creating new exchange entry with ID: ${uniqueExchangeId}`)

      // Create NEW Hyperliquid exchange config with unique ID
      try {
        const { updateExchangeConfig } = await import('@/lib/go-crypto')

        await updateExchangeConfig(authHeader, uniqueExchangeId, {
          enabled: true,
          api_key: wallet.privateKey,
          secret_key: '',
          testnet: false,
          hyperliquid_wallet_addr: wallet.address,
        })

        console.log(`✅ New Hyperliquid exchange created: ${uniqueExchangeId}`)
        console.log(`💰 Wallet address: ${wallet.address}`)
        console.log(`💰 IMPORTANT: Please fund wallet ${wallet.address} with USDC to start trading`)
      } catch (error) {
        console.error('❌ Failed to create Hyperliquid exchange:', error)
        return NextResponse.json(
          { error: `Failed to create Hyperliquid exchange: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    // ====================================
    // 🔐 STEP 3: Create trader in Go backend
    // ====================================
    console.log('🔄 Creating trader in Go backend...')

    // Forward request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/traders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        ...body,
        ai_model_id: aiModelId, // Ensure we use the correct AI model ID
        exchange_id: uniqueExchangeId, // Use the unique exchange ID if generated
      }),
    })

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('⚠️ [API Route] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error(`❌ [API Route] Backend error: ${response.status}`, errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to create trader' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [API Route] Trader created:', data.trader_id)

    return NextResponse.json({
      success: true,
      trader: data,
      message: 'Trader created successfully',
      walletAddress: walletAddress || undefined,
      isNewWallet: isNewWallet,
      needsDeposit: body.exchange_id === 'hyperliquid' && !!walletAddress, // Show deposit modal for all Hyperliquid traders with wallet
    })

  } catch (error) {
    console.error('❌ [API Route] Create trader API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create trader',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

