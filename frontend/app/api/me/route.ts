import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let roleProfile = null
    if (profile?.role === 'patient') {
      const { data: patient } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      roleProfile = patient
    } else if (profile?.role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctor_profiles')
        .select('*, specialty:specialties(*)')
        .eq('user_id', user.id)
        .single()
      roleProfile = doctor
    }

    return NextResponse.json({
      user,
      profile,
      roleProfile,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
