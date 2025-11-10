import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: traderId } = await params
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    console.log(`🔄 [API] Fetching account balance for trader ${traderId}...`)

    const response = await fetch(`${BACKEND_URL}/api/account?trader_id=${traderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch account balance: ${response.status}`)
    }

    const accountData = await response.json()
    console.log(`✅ [API] Account balance fetched for trader ${traderId}`)

    return NextResponse.json({
      available_balance: accountData.available_balance || 0,
      total_equity: accountData.total_equity || 0,
      total_pnl: accountData.total_pnl || 0,
      total_pnl_pct: accountData.total_pnl_pct || 0,
      initial_balance: accountData.initial_balance || 0, // Include initial_balance for display
    })

  } catch (error: any) {
    console.error('❌ [API] Account balance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch account balance' },
      { status: 500 }
    )
  }
}

