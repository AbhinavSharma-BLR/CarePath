-- ===================================================
-- CAREPATH TELEMEDICINE PLATFORM — INITIAL DB SCHEMA
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  dob         DATE,
  gender      TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  avatar_url  TEXT,
  role        TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PATIENT PROFILES
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blood_group     TEXT,
  height_cm       INT,
  weight_kg       INT,
  allergies       TEXT[] DEFAULT '{}',
  current_meds    TEXT[] DEFAULT '{}',
  conditions      TEXT[] DEFAULT '{}',
  emergency_name  TEXT,
  emergency_phone TEXT,
  abha_id         TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SPECIALTIES
CREATE TABLE IF NOT EXISTS public.specialties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DOCTOR PROFILES
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty_id        UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  license_number      TEXT UNIQUE NOT NULL,
  bio                 TEXT,
  experience_years    INT DEFAULT 0,
  languages           TEXT[] DEFAULT '{"English"}',
  consultation_fee    DECIMAL(10,2) DEFAULT 0.00,
  is_available_now    BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOCTOR AVAILABILITY
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id          UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  start_time         TIME NOT NULL,
  end_time           TIME NOT NULL,
  slot_duration_mins INT DEFAULT 15,
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date, start_time)
);

-- 6. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  specialty_id      UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  status            TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'in_queue', 'in_consultation', 'completed', 'cancelled', 'expired')),
  consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio')),
  reason            TEXT,
  is_followup       BOOLEAN DEFAULT false,
  parent_appt_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QUEUE ENTRIES
CREATE TABLE IF NOT EXISTS public.queue_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id      UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  position            INT NOT NULL,
  status              TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_consultation', 'completed', 'cancelled', 'expired')),
  estimated_wait_mins INT DEFAULT 0,
  joined_at           TIMESTAMPTZ DEFAULT NOW(),
  called_at           TIMESTAMPTZ
);

-- 8. CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.consultations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'abandoned')),
  clinical_notes  TEXT,
  webrtc_offer    TEXT,
  webrtc_answer   TEXT,
  ice_candidates  JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  message_type    TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  file_url        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

-- 10. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnosis       TEXT,
  advice          TEXT,
  follow_up_date  DATE,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine        TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  duration        TEXT,
  instructions    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS public.medical_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT,
  file_size   INT,
  record_type TEXT CHECK (record_type IN ('lab_report', 'prescription', 'imaging', 'discharge', 'other')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profile reading" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patient self management" ON public.patient_profiles FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public specialties read" ON public.specialties FOR SELECT USING (true);

CREATE POLICY "Public doctors read" ON public.doctor_profiles FOR SELECT USING (true);
CREATE POLICY "Doctor self update" ON public.doctor_profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Public availability read" ON public.doctor_availability FOR SELECT USING (true);

CREATE POLICY "Patient appointments" ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctor appointments" ON public.appointments FOR SELECT USING (
  doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Patient create appointment" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Queue participant read" ON public.queue_entries FOR SELECT USING (
  patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Consultation participant access" ON public.consultations FOR ALL USING (
  patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Consultation message access" ON public.messages FOR ALL USING (
  consultation_id IN (
    SELECT id FROM public.consultations
    WHERE patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Prescription view" ON public.prescriptions FOR SELECT USING (
  patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Patient records owner access" ON public.medical_records FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Notification owner access" ON public.notifications FOR ALL USING (user_id = auth.uid());
