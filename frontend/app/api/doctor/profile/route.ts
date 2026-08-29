import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

    const res = await fetch(`${API_BASE_URL}/doctor/profile`, {
      method: 'GET',
      headers,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json()

    const res = await fetch(`${API_BASE_URL}/doctor/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
