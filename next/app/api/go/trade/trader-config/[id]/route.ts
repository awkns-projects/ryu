import { NextRequest, NextResponse } from 'next/server'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: traderId } = await params

    // Get JWT token from Authorization header (sent from frontend)
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [API Route] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    console.log(`🔄 [API Route] Fetching trader config for ${traderId}...`)

    // Forward request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/traders/${traderId}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
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
      console.error(`❌ [API Route] This might be due to:`)
      console.error(`   1. Trader not in database`)
      console.error(`   2. AI model not found for this user`)
      console.error(`   3. Exchange not found for this user`)
      console.error(`   4. User ID mismatch`)
      return NextResponse.json(
        {
          error: errorData.error || 'Failed to fetch trader config',
          debug: {
            traderId,
            status: response.status,
            possibleCauses: [
              'Trader not in database',
              'AI model not configured for your account',
              'Exchange not configured for your account',
              'User ID mismatch'
            ]
          }
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [API Route] Trader config fetched:', traderId)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ [API Route] Trader config API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch trader config',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

