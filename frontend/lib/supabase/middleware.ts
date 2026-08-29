import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check CarePath custom JWT session cookie
  const accessToken =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('carepath_session')?.value

  const isAuthenticated = Boolean(user || accessToken)
  const userRole = request.cookies.get('carepath_role')?.value || 'PATIENT'

  const path = request.nextUrl.pathname

  // Protected route checking
  const isPatientRoute = path.startsWith('/patient')
  const isDoctorRoute = path.startsWith('/doctor')
  const isAdminRoute = path.startsWith('/admin')

  if ((isPatientRoute || isDoctorRoute || isAdminRoute) && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  // Role-Based Route Enforcement for Authenticated Users
  if (isAuthenticated) {
    // Non-Admin attempting to access Admin route -> Redirect to respective dashboard
    if (isAdminRoute && userRole !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'
      return NextResponse.redirect(url)
    }

    // Admin attempting to access non-admin protected routes -> Redirect to Admin dashboard
    if ((isPatientRoute || isDoctorRoute) && userRole === 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    // Patient attempting to access Doctor protected route -> Redirect to Patient Dashboard
    if (isDoctorRoute && userRole === 'PATIENT') {
      const url = request.nextUrl.clone()
      url.pathname = '/patient/dashboard'
      return NextResponse.redirect(url)
    }

    // Doctor attempting to access Patient protected route -> Redirect to Doctor Dashboard
    if (isPatientRoute && userRole === 'DOCTOR') {
      const url = request.nextUrl.clone()
      url.pathname = '/doctor/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
