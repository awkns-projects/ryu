import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Interface matching Go backend UpdateTraderRequest (same as CreateTraderRequest)
// All fields are optional for update, but we send all to ensure they're saved
interface UpdateTraderRequest {
  name?: string                      // trader name
  ai_model_id?: string              // AI model ID
  exchange_id?: string              // exchange ID
  initial_balance?: number          // initial balance amount
  scan_interval_minutes?: number    // how often AI makes decisions (3-60 minutes)
  btc_eth_leverage?: number         // leverage for BTC/ETH (1-50x)
  altcoin_leverage?: number         // leverage for altcoins (1-20x)
  trading_symbols?: string          // comma-separated symbols e.g. "BTCUSDT,ETHUSDT"
  custom_prompt?: string            // custom strategy prompt or template content
  override_base_prompt?: boolean    // false = append to base, true = replace base
  system_prompt_template?: string   // template name e.g. "Hansen", "default"
  is_cross_margin?: boolean         // false = isolated margin, true = cross margin
  use_coin_pool?: boolean           // use coin pool signals
  use_oi_top?: boolean              // use OI top signals
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: traderId } = await params

    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [API Route] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: UpdateTraderRequest = await request.json()

    console.log(`🔄 [API Route] Updating trader ${traderId}...`)
    console.log(`📦 [API Route] COMPLETE payload being sent to Go backend (PUT /api/traders/${traderId}):`)
    console.log('   ✅ name:', body.name)
    console.log('   ✅ ai_model_id:', body.ai_model_id)
    console.log('   ✅ exchange_id:', body.exchange_id)
    console.log('   ✅ initial_balance:', body.initial_balance)
    console.log('   ✅ trading_symbols:', body.trading_symbols || '(empty)')
    console.log('   ✅ custom_prompt:', body.custom_prompt ? `${body.custom_prompt.substring(0, 50)}...` : '(empty)')
    console.log('   ✅ override_base_prompt:', body.override_base_prompt)
    console.log('   ✅ system_prompt_template:', body.system_prompt_template)
    console.log('   ✅ is_cross_margin:', body.is_cross_margin, '← false=ISOLATED, true=CROSS')
    console.log('   ✅ btc_eth_leverage:', body.btc_eth_leverage)
    console.log('   ✅ altcoin_leverage:', body.altcoin_leverage)
    console.log('   ✅ scan_interval_minutes:', body.scan_interval_minutes)
    console.log('   ✅ use_coin_pool:', body.use_coin_pool)
    console.log('   ✅ use_oi_top:', body.use_oi_top)

    // Forward request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/traders/${traderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
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
        { error: errorData.error || 'Failed to update trader' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [API Route] Trader updated:', traderId)
    console.log('📊 [API Route] Go backend UPDATE response:', JSON.stringify(data, null, 2))
    console.log('📊 [API Route] Checking fields in response:', {
      has_trading_symbols: !!data.trading_symbols,
      has_custom_prompt: !!data.custom_prompt,
      has_system_prompt_template: !!data.system_prompt_template,
      has_btc_eth_leverage: data.btc_eth_leverage !== undefined,
      has_altcoin_leverage: data.altcoin_leverage !== undefined,
      has_is_cross_margin: data.is_cross_margin !== undefined,
    })

    return NextResponse.json({
      success: true,
      trader: data,
      message: 'Trader updated successfully',
    })

  } catch (error) {
    console.error('❌ [API Route] Update trader API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update trader',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

