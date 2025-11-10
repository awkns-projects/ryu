import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Get AI performance/learning analytics for a trader
 * Backend endpoint: GET /api/performance?trader_id=X
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

    console.log(`🔄 [API] Fetching AI performance for trader ${traderId}...`)

    const response = await fetch(
      `${BACKEND_URL}/api/performance?trader_id=${traderId}`,
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
      throw new Error(errorData.error || `Failed to fetch AI performance: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ [API] AI performance fetched for trader ${traderId}`)

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('❌ [API] AI performance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch AI performance' },
      { status: 500 }
    )
  }
}

