import { NextRequest, NextResponse } from 'next/server'

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
    const body = await request.json()

    console.log('🔄 [API Route] Creating trader on Go backend...', body.name)

    // Forward request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/traders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward JWT token to Go backend
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

