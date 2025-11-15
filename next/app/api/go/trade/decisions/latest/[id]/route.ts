import { NextRequest, NextResponse } from 'next/server'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Get latest decision logs for a trader
 * Backend endpoint: GET /api/decisions/latest?trader_id=X
 */
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

    console.log(`🔄 [API] Fetching latest decisions for trader ${traderId}...`)

    const response = await fetch(
      `${BACKEND_URL}/api/decisions/latest?trader_id=${traderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch latest decisions: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ [API] Latest decisions fetched for trader ${traderId}`)

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('❌ [API] Latest decisions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch latest decisions' },
      { status: 500 }
    )
  }
}

