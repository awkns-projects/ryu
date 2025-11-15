import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${GO_API_URL}/api/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('System config API error:', response.status, text);
      return NextResponse.json(
        { error: `Failed to fetch system config: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('System config API error: Expected JSON but got:', contentType, text);
      return NextResponse.json(
        { error: 'Invalid response format from system config API' },
        { status: 500 }
      );
    }

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

