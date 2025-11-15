import { NextRequest, NextResponse } from 'next/server'
import { generateEthereumWallet } from '@/lib/wallet'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
    // 🔐 STEP 1: Find/create AI Model (supports any model including OpenAI)
    // ====================================
    // Use ai_model_id from request body, or default to 'deepseek'
    let requestedModelId = body.ai_model_id || 'deepseek'
    let aiModelId = requestedModelId
    console.log(`🔍 Searching for AI model: ${requestedModelId}...`)

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

      // Find the requested model by provider or ID
      let existingModel = Array.isArray(aiModelsData)
        ? aiModelsData.find((m: any) => 
            m.provider?.toLowerCase() === requestedModelId.toLowerCase() ||
            m.id?.toLowerCase() === requestedModelId.toLowerCase()
          )
        : null

      if (existingModel) {
        // Use the existing model's actual ID
        aiModelId = existingModel.id
        console.log(`✅ Found existing ${requestedModelId} model with ID: ${aiModelId}`)
      } else {
        console.log(`💡 ${requestedModelId} AI model not found, attempting to create...`)

        // Auto-create model based on type
        if (requestedModelId.toLowerCase() === 'deepseek') {
          // Create DeepSeek AI model
          const deepseekApiKey = process.env.DEEPSEEK_API_KEY

          if (!deepseekApiKey) {
            return NextResponse.json(
              { error: 'DEEPSEEK_API_KEY environment variable is not set. Please configure it first.' },
              { status: 400 }
            )
          }

          try {
            const { updateAIModelConfig } = await import('@/lib/go-crypto')
            console.log('🔐 Attempting to create DeepSeek AI model with encryption...')
            await updateAIModelConfig(authHeader, 'deepseek', {
              enabled: true,
              api_key: deepseekApiKey,
              custom_api_url: '',
              custom_model_name: '',
            })
            console.log('✅ DeepSeek AI model created successfully')
          } catch (error) {
            console.error('❌ Failed to create DeepSeek AI model:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return NextResponse.json(
              { 
                error: `Failed to create DeepSeek AI model: ${errorMessage}. Please ensure DEEPSEEK_API_KEY is set correctly.`,
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
              },
              { status: 500 }
            )
          }
        } else if (requestedModelId.toLowerCase() === 'openai' || requestedModelId.toLowerCase() === 'custom') {
          // Create OpenAI/custom AI model
          const openaiApiKey = process.env.OPENAI_API_KEY

          if (!openaiApiKey) {
            return NextResponse.json(
              { error: 'OPENAI_API_KEY environment variable is not set. Please configure it first, or configure OpenAI manually through the settings.' },
              { status: 400 }
            )
          }

          try {
            const { updateAIModelConfig } = await import('@/lib/go-crypto')
            console.log('🔐 Attempting to create OpenAI/custom AI model with encryption...')
            
            // Use 'custom' as the provider ID for OpenAI (Go backend supports this)
            await updateAIModelConfig(authHeader, 'custom', {
              enabled: true,
              api_key: openaiApiKey,
              custom_api_url: 'https://api.openai.com/v1',
              custom_model_name: process.env.OPENAI_MODEL_NAME || 'gpt-4o',
            })
            console.log('✅ OpenAI/custom AI model created successfully')
            aiModelId = 'custom' // Use 'custom' as the model ID
          } catch (error) {
            console.error('❌ Failed to create OpenAI AI model:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return NextResponse.json(
              { 
                error: `Failed to create OpenAI AI model: ${errorMessage}. Please ensure OPENAI_API_KEY is set correctly, or configure OpenAI manually through the settings.`,
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
              },
              { status: 500 }
            )
          }
        } else {
          // For other models, just use the requested ID (user should configure it manually first)
          console.log(`⚠️ Model ${requestedModelId} not found and cannot be auto-created. Using requested ID.`)
          console.log(`💡 Please ensure the model is configured in settings before creating the trader.`)
          aiModelId = requestedModelId
        }

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
            ? refreshedData.find((m: any) => 
                m.provider?.toLowerCase() === requestedModelId.toLowerCase() ||
                m.id?.toLowerCase() === requestedModelId.toLowerCase() ||
                m.id?.toLowerCase() === 'custom'
              )
            : null

          if (createdModel) {
            aiModelId = createdModel.id
            console.log(`✅ Using created ${requestedModelId} AI model ID: ${aiModelId}`)
          } else {
            console.warn(`⚠️ ${requestedModelId} model created but not found in refreshed list, using requested ID`)
            aiModelId = requestedModelId
          }
        } else {
          console.warn(`⚠️ Failed to refresh AI models list, using requested ID`)
          aiModelId = requestedModelId
        }
      }
    } else {
      // If we can't fetch models, just use the requested ID
      console.warn(`⚠️ Failed to fetch AI models list, using requested ID: ${requestedModelId}`)
      aiModelId = requestedModelId
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
      console.error(`❌ [API Route] Full error response:`, JSON.stringify(errorData, null, 2))
      
      // Provide more detailed error message
      const errorMessage = errorData.error || errorData.message || 'Failed to create trader'
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorData.details || (process.env.NODE_ENV === 'development' ? errorData : undefined),
          status: response.status
        },
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

