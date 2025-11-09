import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${GO_API_URL}/api/system-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('System config API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to authentication service' },
      { status: 500 }
    );
  }
}

