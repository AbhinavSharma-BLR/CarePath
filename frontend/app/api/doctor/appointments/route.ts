import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cookieToken = req.cookies.get('accessToken')?.value

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers.authorization = authHeader
    } else if (cookieToken) {
      headers.authorization = `Bearer ${cookieToken}`
    }

    const res = await fetch(`${API_BASE_URL}/doctor/appointments`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
