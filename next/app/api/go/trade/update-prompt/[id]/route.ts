import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: traderId } = await params
    const authHeader = request.headers.get('authorization')
    const body = await request.json()

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    console.log(`🔄 Updating prompt for trader ${traderId}...`)

    // Forward to Go backend
    const response = await fetch(`${BACKEND_URL}/api/trader/${traderId}/prompt`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend error:', errorText)
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Prompt updated successfully')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error updating trader prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update trader prompt' },
      { status: 500 }
    )
  }
}

