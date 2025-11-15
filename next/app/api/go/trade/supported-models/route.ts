import { NextRequest, NextResponse } from 'next/server'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    // Fetch supported AI models from Go backend (no auth required)
    const response = await fetch(`${BACKEND_URL}/api/supported-models`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch supported AI models' },
        { status: response.status }
      )
    }

    const models = await response.json()
    
    return NextResponse.json({
      models: Array.isArray(models) ? models : [],
      totalCount: Array.isArray(models) ? models.length : 0,
    })

  } catch (error) {
    console.error('❌ [API Route] Failed to fetch supported AI models:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch supported AI models',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

