import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get JWT token from Authorization header (sent from frontend)
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [API Route] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    console.log(`🔄 [API Route] Deleting trader ${id} on Go backend...`)

    // Forward delete request to Go backend
    const response = await fetch(`${BACKEND_URL}/api/traders/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward JWT token to Go backend
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
        { error: errorData.error || 'Failed to delete trader' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`✅ [API Route] Trader ${id} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'Trader deleted successfully',
      data,
    })

  } catch (error) {
    console.error('❌ [API Route] Delete trader API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete trader',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

