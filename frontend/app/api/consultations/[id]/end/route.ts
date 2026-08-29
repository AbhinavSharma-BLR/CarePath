import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = getAuthHeader(req)
    const res = await fetch(`${API_BASE_URL}/consultations/${params.id}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify({}),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to end consultation' },
      { status: 500 }
    )
  }
}
