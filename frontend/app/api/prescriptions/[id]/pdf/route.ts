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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthHeader(req)

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required.' },
        { status: 401 }
      )
    }

    const id = params.id
    const res = await fetch(`${API_BASE_URL}/prescriptions/${id}/pdf`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: authHeader,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch PDF URL' },
      { status: 500 }
    )
  }
}
