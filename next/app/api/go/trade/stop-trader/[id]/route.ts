import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function POST(
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

    console.log(`🔄 [API] Stopping trader ${traderId}...`)

    const response = await fetch(`${BACKEND_URL}/api/traders/${traderId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to stop trader: ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ [API] Trader ${traderId} stopped successfully`)

    return NextResponse.json({
      success: true,
      message: 'Trader stopped successfully',
      ...result,
    })

  } catch (error: any) {
    console.error('❌ [API] Stop trader error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stop trader' },
      { status: 500 }
    )
  }
}

