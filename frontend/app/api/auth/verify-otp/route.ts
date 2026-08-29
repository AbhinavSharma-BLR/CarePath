import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const fastifyUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Forward request to Fastify API
    let res = await fetch(`${fastifyUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(async () => {
      // Fallback: try /api/auth/verify-otp on Fastify
      return await fetch(`${fastifyUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          code: errorData.code || errorData.error || 'ERROR',
          message: errorData.message || 'Incorrect or expired OTP' 
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    const response = NextResponse.json(data, { status: 200 })

    // Set accessToken cookie for server-side Next.js middleware verification
    if (data.accessToken) {
      response.cookies.set('accessToken', data.accessToken, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      })
      response.cookies.set('carepath_session', 'active', {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      })
      if (data.user?.role) {
        response.cookies.set('carepath_role', data.user.role, {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        })
      }
    }

    return response
  } catch (err: any) {
    console.error('❌ [NEXT.JS VERIFY OTP ROUTE ERROR]', err)
    return NextResponse.json(
      { success: false, message: 'Unable to connect to CarePath+ verification service' },
      { status: 500 }
    )
  }
}
