import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const body = await request.json()

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    console.log('🔄 Fetching batch equity history for traders:', body.trader_ids)

    // Forward to Go backend
    const response = await fetch(`${BACKEND_URL}/api/equity-history-batch`, {
      method: 'POST',
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
    console.log('✅ Batch equity history fetched successfully')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error fetching batch equity history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch equity history' },
      { status: 500 }
    )
  }
}

