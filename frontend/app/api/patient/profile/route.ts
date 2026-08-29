import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(req: NextRequest) {
  try {
    const authHeader =
      req.headers.get('authorization') ||
      (req.cookies.get('accessToken')?.value ? `Bearer ${req.cookies.get('accessToken')?.value}` : '')

    const res = await fetch(`${API_BASE_URL}/patient/profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch patient profile' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const authHeader =
      req.headers.get('authorization') ||
      (req.cookies.get('accessToken')?.value ? `Bearer ${req.cookies.get('accessToken')?.value}` : '')

    const res = await fetch(`${API_BASE_URL}/patient/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to save patient profile' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return PUT(req)
}
