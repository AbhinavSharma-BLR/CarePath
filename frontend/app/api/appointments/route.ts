import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const dynamic = 'force-dynamic'

function getAuthHeader(req: NextRequest): string {
  const reqAuth = req.headers.get('authorization')
  if (reqAuth && reqAuth.startsWith('Bearer ')) {
    const token = reqAuth.split(' ')[1]
    if (token && token.startsWith('eyJ')) return reqAuth
  }

  const accessTokenCookie = req.cookies.get('accessToken')?.value
  if (accessTokenCookie && accessTokenCookie.startsWith('eyJ')) {
    return `Bearer ${accessTokenCookie}`
  }

  const sessionCookie = req.cookies.get('carepath_session')?.value
  if (sessionCookie && sessionCookie.startsWith('eyJ')) {
    return `Bearer ${sessionCookie}`
  }

  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authHeader = getAuthHeader(req)

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required to book an appointment. Please log in as a Patient.' },
        { status: 401 }
      )
    }

    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to book appointment' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = getAuthHeader(req)

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    const res = await fetch(`${API_BASE_URL}/appointments/my-appointments`, {
      headers: {
        'Content-Type': 'application/json',
        authorization: authHeader,
      },
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
