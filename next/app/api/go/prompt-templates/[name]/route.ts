import { NextRequest, NextResponse } from 'next/server'

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    const response = await fetch(`${GO_API_URL}/api/prompt-templates/${name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Go API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch prompt template from Go API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching prompt template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt template' },
      { status: 500 }
    )
  }
}

