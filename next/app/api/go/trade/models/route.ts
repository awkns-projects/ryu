import { NextRequest, NextResponse } from 'next/server'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Fetch AI models from Go backend
    const response = await fetch(`${BACKEND_URL}/api/models`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch AI models' },
        { status: response.status }
      )
    }

    const models = await response.json()
    
    // Filter to only show configured models (enabled or with custom API URL)
    const configuredModels = Array.isArray(models)
      ? models.filter((m: any) => m.enabled || (m.custom_api_url && m.custom_api_url.trim() !== ''))
      : []

    return NextResponse.json({
      models: configuredModels,
      totalCount: configuredModels.length,
    })

  } catch (error) {
    console.error('❌ [API Route] Failed to fetch AI models:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch AI models',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

