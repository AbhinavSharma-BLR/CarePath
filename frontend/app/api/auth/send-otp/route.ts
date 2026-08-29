import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const fastifyUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Forward request to Fastify API
    let res = await fetch(`${fastifyUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(async () => {
      // Fallback: try /api/auth/send-otp on Fastify
      return await fetch(`${fastifyUrl}/api/auth/send-otp`, {
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
          message: errorData.message || 'OTP service unavailable' 
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('❌ [NEXT.JS OTP ROUTE ERROR]', err)
    return NextResponse.json(
      { success: false, message: 'Unable to connect to CarePath+ OTP service' },
      { status: 500 }
    )
  }
}
