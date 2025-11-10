import { NextRequest, NextResponse } from 'next/server'
import { generateEthereumWallet } from '@/lib/wallet'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Interface matching Go backend CreateTraderRequest EXACTLY
interface CreateTraderRequest {
  name: string                      // required
  ai_model_id: string              // required
  exchange_id: string              // required
  initial_balance?: number         // optional, default handled by backend
  scan_interval_minutes?: number   // optional, default handled by backend
  btc_eth_leverage?: number        // optional, default 5
  altcoin_leverage?: number        // optional, default 5
  trading_symbols?: string         // optional, comma-separated e.g. "BTCUSDT,ETHUSDT"
  custom_prompt?: string           // optional, custom or template prompt
  override_base_prompt?: boolean   // optional, default false
  system_prompt_template?: string  // optional, template name or 'default'
  is_cross_margin?: boolean        // optional, default true (we send false for isolated)
  use_coin_pool?: boolean          // optional, default false
  use_oi_top?: boolean             // optional, default false
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
    console.log('📊 [API Route] Trader creation data:', {
      name: body.name,
      trading_symbols: body.trading_symbols,
      custom_prompt: body.custom_prompt ? `${body.custom_prompt.substring(0, 50)}...` : '(none)',
      system_prompt_template: body.system_prompt_template,
      btc_eth_leverage: body.btc_eth_leverage,
      altcoin_leverage: body.altcoin_leverage,
      is_cross_margin: body.is_cross_margin,
    })

    // ====================================
    // 🔐 STEP 1: Auto-find/create DeepSeek AI Model
    // ====================================
    let aiModelId = 'deepseek' // Always default to DeepSeek
    console.log(`🔍 Searching for DeepSeek AI model...`)

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
      // ALWAYS search for DeepSeek by provider first (most reliable)
      let existingModel = Array.isArray(aiModelsData)
        ? aiModelsData.find((m: any) => m.provider === 'deepseek' || m.provider === 'DeepSeek')
        : null

      // If not found by provider, try exact ID match as fallback
      if (!existingModel) {
        existingModel = Array.isArray(aiModelsData)
          ? aiModelsData.find((m: any) => m.id === 'deepseek' || m.id === 'DeepSeek')
          : null
      }

      if (existingModel) {
        // Use the existing model's actual ID
        aiModelId = existingModel.id
        console.log(`✅ Found existing DeepSeek model with ID: ${aiModelId}`)
      }

      console.log(`🔎 DeepSeek AI model found:`, !!existingModel)

      if (!existingModel) {
        console.log(`💡 DeepSeek AI model not found, creating...`)

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

          await updateAIModelConfig(authHeader, 'deepseek', {
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
              ? refreshedData.find((m: any) => m.provider === 'deepseek' || m.provider === 'DeepSeek')
              : null

            if (createdModel) {
              aiModelId = createdModel.id
              console.log(`✅ Using created DeepSeek AI model ID: ${aiModelId}`)
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
        console.log(`✅ DeepSeek AI model already exists with ID: ${aiModelId}`)
      }
    }

    // ====================================
    // 🔐 STEP 2: Ensure Hyperliquid exchange exists
    // ====================================
    let walletAddress = ''
    let isNewWallet = false

    if (body.exchange_id === 'hyperliquid') {
      console.log('🔑 Hyperliquid exchange detected, checking if it exists...')

      // Check if Hyperliquid exchange already exists
      const exchangesResponse = await fetch(`${BACKEND_URL}/api/exchanges`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      })

      if (exchangesResponse.ok) {
        const exchangesData = await exchangesResponse.json()
        const existingHyperliquid = Array.isArray(exchangesData)
          ? exchangesData.find((ex: any) => ex.id === 'hyperliquid')
          : null

        if (existingHyperliquid) {
          console.log(`✅ Using existing Hyperliquid exchange`)
          walletAddress = existingHyperliquid.hyperliquid_wallet_addr || ''
        } else {
          console.log('💡 Hyperliquid exchange not found, creating it...')

          // Generate a new wallet
          const wallet = generateEthereumWallet()
          console.log('✅ New wallet generated:', wallet.address)

          walletAddress = wallet.address
          isNewWallet = true

          // Create Hyperliquid exchange config
          try {
            const { updateExchangeConfig } = await import('@/lib/go-crypto')

            await updateExchangeConfig(authHeader, 'hyperliquid', {
              enabled: true,
              api_key: wallet.privateKey,
              secret_key: '',
              testnet: false,
              hyperliquid_wallet_addr: wallet.address,
            })

            console.log(`✅ Hyperliquid exchange created`)
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
      }
    }

    // ====================================
    // 🔐 STEP 3: Create trader in Go backend
    // ====================================
    console.log('🔄 Creating trader in Go backend...')

    const goBackendPayload = {
      ...body,
      ai_model_id: aiModelId, // Ensure we use the correct AI model ID
      exchange_id: body.exchange_id, // Always use the original exchange_id (e.g., 'hyperliquid')
    }

    console.log('📦 [API Route] COMPLETE payload being sent to Go backend (POST /api/traders):')
    console.log('   ✅ name:', goBackendPayload.name)
    console.log('   ✅ ai_model_id:', goBackendPayload.ai_model_id)
    console.log('   ✅ exchange_id:', goBackendPayload.exchange_id)
    console.log('   ✅ initial_balance:', goBackendPayload.initial_balance)
    console.log('   ✅ trading_symbols:', goBackendPayload.trading_symbols || '(empty)')
    console.log('   ✅ custom_prompt:', goBackendPayload.custom_prompt ? `${goBackendPayload.custom_prompt.substring(0, 50)}...` : '(empty)')
    console.log('   ✅ override_base_prompt:', goBackendPayload.override_base_prompt)
    console.log('   ✅ system_prompt_template:', goBackendPayload.system_prompt_template)
    console.log('   ✅ is_cross_margin:', goBackendPayload.is_cross_margin, '← false=ISOLATED, true=CROSS')
    console.log('   ✅ btc_eth_leverage:', goBackendPayload.btc_eth_leverage)
    console.log('   ✅ altcoin_leverage:', goBackendPayload.altcoin_leverage)
    console.log('   ✅ scan_interval_minutes:', goBackendPayload.scan_interval_minutes)
    console.log('   ✅ use_coin_pool:', goBackendPayload.use_coin_pool)
    console.log('   ✅ use_oi_top:', goBackendPayload.use_oi_top)

    // Forward request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/traders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(goBackendPayload),
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

