import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authHeader =
      req.headers.get('authorization') ||
      (req.cookies.get('accessToken')?.value ? `Bearer ${req.cookies.get('accessToken')?.value}` : '')

    const res = await fetch(`${API_BASE_URL}/patient/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}
