import { NextRequest, NextResponse } from 'next/server'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
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

    console.log('🔄 [API Route] Fetching exchange configurations...')

    // Forward request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/exchanges`, {
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
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch exchanges' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [API Route] Exchanges fetched:', data.length || 0)

    return NextResponse.json({
      exchanges: data,
    })

  } catch (error) {
    console.error('❌ [API Route] Fetch exchanges API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch exchanges',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

