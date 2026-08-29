import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || ''

    const res = await fetch(
      `${API_BASE_URL}/doctors/${params.id}/availability${date ? `?date=${date}` : ''}`,
      {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    )

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch doctor availability' },
      { status: 500 }
    )
  }
}
