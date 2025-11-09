import { NextRequest, NextResponse } from 'next/server'

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${GO_API_URL}/api/prompt-templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Go API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch prompt templates from Go API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching prompt templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt templates' },
      { status: 500 }
    )
  }
}

