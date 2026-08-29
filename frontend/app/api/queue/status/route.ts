import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const appointmentId = searchParams.get('appointmentId')

    const res = await fetch(`${API_BASE_URL}/queue/status?appointmentId=${appointmentId || ''}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch queue status' },
      { status: 500 }
    )
  }
}
