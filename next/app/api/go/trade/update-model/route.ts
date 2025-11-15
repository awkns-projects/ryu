import { NextRequest, NextResponse } from 'next/server'
import { updateAIModelConfig } from '@/lib/go-crypto'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function PUT(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { modelId, enabled, api_key, custom_api_url, custom_model_name } = body

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 [API Route] Updating AI model: ${modelId}`)

    // Use the go-crypto helper to encrypt and send the update
    await updateAIModelConfig(authHeader, modelId, {
      enabled: enabled !== undefined ? enabled : true,
      api_key: api_key || '',
      custom_api_url: custom_api_url || '',
      custom_model_name: custom_model_name || '',
    })

    console.log(`✅ [API Route] AI model ${modelId} updated successfully`)

    return NextResponse.json({
      success: true,
      message: 'AI model updated successfully',
    })

  } catch (error) {
    console.error('❌ [API Route] Failed to update AI model:', error)
    return NextResponse.json(
      {
        error: 'Failed to update AI model',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

