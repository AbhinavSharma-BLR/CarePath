import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST() {
  try {
    // Notify backend Fastify API
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null)

    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear server-side session cookies
    response.cookies.delete('accessToken')
    response.cookies.delete('carepath_session')
    response.cookies.delete('refreshToken')

    // Also set explicit expired cookie values to ensure browser removal
    response.cookies.set('accessToken', '', { path: '/', maxAge: 0 })
    response.cookies.set('carepath_session', '', { path: '/', maxAge: 0 })
    response.cookies.set('refreshToken', '', { path: '/', maxAge: 0 })

    return response
  } catch (error) {
    const response = NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    )
    response.cookies.delete('accessToken')
    response.cookies.delete('carepath_session')
    response.cookies.delete('refreshToken')
    return response
  }
}
