import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  role: z.enum(['patient', 'doctor']),
  licenseNumber: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.parse(body)

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: {
          full_name: parsed.fullName,
          role: parsed.role,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      // Create profile row
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: parsed.fullName,
        phone: parsed.phone,
        dob: parsed.dob || null,
        gender: parsed.gender || 'prefer_not_to_say',
        role: parsed.role,
      })

      if (parsed.role === 'patient') {
        await supabase.from('patient_profiles').upsert({
          user_id: authData.user.id,
        })
      } else {
        await supabase.from('doctor_profiles').upsert({
          user_id: authData.user.id,
          license_number: parsed.licenseNumber || `MCI-${Date.now()}`,
          verification_status: 'pending',
        })
      }
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 })
  }
}
