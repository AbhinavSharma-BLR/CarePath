'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Activity, Phone, User, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { LiquidButton } from '@/components/ui/button-1'
import { CarePathLogo } from '@/components/brand/carepath-logo'

interface SignInPageProps {
  className?: string
  initialMode?: 'login' | 'signup'
}

export const CanvasRevealEffect = ({
  containerClassName,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number
  opacities?: number[]
  colors?: number[][]
  containerClassName?: string
  dotSize?: number
  showGradient?: boolean
  reverse?: boolean
}) => {
  return (
    <div className={cn('h-full relative w-full overflow-hidden bg-[#080808]', containerClassName)}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollGrid {
          0% { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
        @keyframes scrollGridReverse {
          0% { background-position: 40px 40px; }
          100% { background-position: 0px 0px; }
        }
        .animate-grid-bg {
          animation: scrollGrid 3s linear infinite;
        }
        .animate-grid-bg-reverse {
          animation: scrollGridReverse 3s linear infinite;
        }
      `}} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(239,48,48,0.15)_0%,_#080808_100%)] opacity-80 pointer-events-none" />
      {/* Animated subtle grid overlay */}
      <div 
        className={cn("absolute inset-0 pointer-events-none", reverse ? "animate-grid-bg-reverse" : "animate-grid-bg")}
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(239,48,48,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,48,48,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/80 pointer-events-none" />
      )}
    </div>
  )
}

export const SignInPage = ({ className, initialMode = 'login' }: SignInPageProps) => {
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile')

  // Form inputs
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Status & timers
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [timer, setTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true)
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false)

  // 30s Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [step, timer])

  // Focus first OTP input box when OTP screen opens
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 300)
    }
  }, [step])

  // Clean 10-digit mobile number validation
  const sanitizeMobile = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 10)
  }

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorCode(null)

    if (mode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)

    try {
      let res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          phone: mobile,
          purpose: mode,
          role: role,
        }),
      }).catch(() => null)

      if (!res) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        res = await fetch(`${apiBase}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile,
            phone: mobile,
            purpose: mode,
            role: role,
          }),
        }).catch(() => null)
      }

      if (!res || !res.ok) {
        const data = res ? await res.json().catch(() => ({})) : {}
        setErrorCode(data.code || null)
        setError(data.message || `Server returned status ${res?.status || 500}. Unable to send OTP.`)
        setLoading(false)
        return
      }

      setLoading(false)
      setStep('otp')
      setTimer(30)
      setCanResend(false)
    } catch (err: any) {
      setError('Unable to send OTP. Please check your network connection.')
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = cleanValue
      setOtp(newOtp)

      if (cleanValue && index < 5) {
        otpInputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.')
      return
    }

    setLoading(true)
    setError(null)
    setErrorCode(null)

    try {
      let res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          phone: mobile,
          otp: fullOtp,
          name: fullName || undefined,
          role: role,
          purpose: mode,
        }),
      }).catch(() => null)

      if (!res) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        res = await fetch(`${apiBase}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile,
            phone: mobile,
            otp: fullOtp,
            name: fullName || undefined,
            role: role,
            purpose: mode,
          }),
        }).catch(() => null)
      }

      if (!res || !res.ok) {
        const data = res ? await res.json().catch(() => ({})) : {}
        setErrorCode(data.code || null)
        setError(data.message || 'Incorrect or expired OTP. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json().catch(() => ({}))
      const userRole = data.user?.role || role
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('carepath_role', userRole)
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`
        document.cookie = `carepath_session=active; path=/; max-age=604800; SameSite=Lax`
        document.cookie = `carepath_role=${userRole}; path=/; max-age=604800; SameSite=Lax`
      }

      setReverseCanvasVisible(true)
      setTimeout(() => setInitialCanvasVisible(false), 50)
      setTimeout(() => setStep('success'), 300)

      const targetDashboard = userRole === 'ADMIN' ? '/admin/dashboard' : userRole === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'
      setTimeout(() => {
        router.push(targetDashboard)
        router.refresh()
      }, 1900)
    } catch (err: any) {
      setError('Verification failed. Please check your network connection.')
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) return
    setError(null)
    setLoading(true)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      let res = await fetch(`${apiBase}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, phone: mobile }),
      }).catch(() => null)

      if (!res || res.status === 404) {
        res = await fetch(`${apiBase}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, phone: mobile }),
        }).catch(() => null)
      }

      setLoading(false)
      setTimer(30)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex w-full flex-col min-h-screen bg-[#080808] relative text-white', className)}>
      {/* Animated CSS Background */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-[#080808]"
              colors={[
                [239, 48, 48],
                [217, 39, 39],
              ]}
              dotSize={5}
              reverse={false}
            />
          </div>
        )}
        
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-[#080808]"
              colors={[
                [239, 48, 48],
                [255, 100, 100],
              ]}
              dotSize={5}
              reverse={true}
            />
          </div>
        )}
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,8,8,0.7)_0%,_#080808_100%)] pointer-events-none" />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-50 bg-[#111111]/90 backdrop-blur-md border-b border-[#2A2A2A] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <CarePathLogo size="md" showTagline={true} />
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                href={mode === 'login' ? '/signup' : '/login'}
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setStep('mobile')
                  setError(null)
                }}
                className="text-xs font-semibold px-4 py-2 rounded-full border border-[#2A2A2A] bg-[#171717] text-white hover:border-[#EF3030] transition-all"
              >
                {mode === 'login' ? 'Don\'t have an account? Sign Up' : 'Already registered? Sign In'}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {/* STEP 1: MOBILE NUMBER & NAME ENTRY */}
              {step === 'mobile' && (
                <motion.div 
                  key={`mobile-${mode}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-2xl text-[#111111] space-y-6"
                >
                  {/* Card Header */}
                  <div className="text-center space-y-1.5">
                    <h1 className="text-2xl font-bold text-[#111111]">
                      {mode === 'login' ? 'Welcome Back' : 'Create Your CarePath Account'}
                    </h1>
                    <p className="text-sm text-[#666666]">
                      {mode === 'login' 
                        ? 'Login securely using your mobile number' 
                        : 'Connect with certified doctors & manage virtual queues'}
                    </p>
                  </div>

                  {/* Error Alert Card */}
                  {error && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-red-200 text-[#111111] space-y-2 text-xs">
                      <div className="flex items-center space-x-2 font-bold text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 text-[#EF3030] flex-shrink-0" />
                        <span>
                          {errorCode === 'USER_NOT_FOUND' || errorCode === 'DOCTOR_NOT_FOUND'
                            ? 'No Account Found'
                            : errorCode === 'ACCOUNT_ALREADY_EXISTS'
                            ? 'Account Already Exists'
                            : errorCode === 'ROLE_MISMATCH'
                            ? 'Role Mismatch'
                            : 'Authentication Notice'}
                        </span>
                      </div>

                      <p className="text-[#555555] leading-relaxed">{error}</p>

                      {errorCode === 'USER_NOT_FOUND' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signup')
                            setError(null)
                            setErrorCode(null)
                          }}
                          className="px-4 py-2 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all inline-block mt-1"
                        >
                          Sign Up / Create Account
                        </button>
                      )}

                      {errorCode === 'ACCOUNT_ALREADY_EXISTS' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login')
                            setError(null)
                            setErrorCode(null)
                          }}
                          className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-black text-white font-bold text-xs shadow-md transition-all inline-block mt-1"
                        >
                          Go to Login
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mobile Form */}
                  <form onSubmit={handleMobileSubmit} className="space-y-4">
                    {/* Role Selector Tabs (Patient vs Doctor) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                        Login As
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-[#F5F5F5] p-1.5 rounded-2xl border border-[#E5E5E5]">
                        <button
                          type="button"
                          onClick={() => { setRole('PATIENT'); setError(null) }}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                            role === 'PATIENT'
                              ? 'bg-[#EF3030] text-white shadow-md shadow-red-500/20 border border-[#EF3030]'
                              : 'bg-white text-[#666666] border border-[#E5E5E5] hover:text-[#111111]'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>👤 Patient</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRole('DOCTOR'); setError(null) }}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                            role === 'DOCTOR'
                              ? 'bg-[#EF3030] text-white shadow-md shadow-red-500/20 border border-[#EF3030]'
                              : 'bg-white text-[#666666] border border-[#E5E5E5] hover:text-[#111111]'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>🩺 Doctor</span>
                        </button>
                      </div>
                    </div>
                    {/* Full Name for Signup */}
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#999999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Mobile Number Input */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                        Mobile Number
                      </label>
                      <div className="flex items-center rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] focus-within:ring-2 focus-within:ring-[#EF3030] overflow-hidden">
                        <div className="px-3.5 py-3 bg-[#F5F5F5] border-r border-[#E5E5E5] text-sm font-bold text-[#111111] flex items-center space-x-1.5">
                          <Phone className="w-4 h-4 text-[#EF3030]" />
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(sanitizeMobile(e.target.value))}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full px-4 py-3 bg-transparent text-sm text-[#111111] placeholder-[#999999] focus:outline-none tracking-widest font-semibold"
                        />
                      </div>
                    </div>

                    <LiquidButton
                      type="submit"
                      disabled={loading || mobile.length !== 10}
                      className="w-full mt-2"
                      icon={loading ? undefined : <ArrowRight className="w-4 h-4" />}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        "Send OTP"
                      )}
                    </LiquidButton>
                  </form>

                  {/* Mode Footer Link */}
                  <div className="pt-2 text-center text-xs text-[#666666]">
                    {mode === 'login' ? (
                      <>
                        Don't have an account?{' '}
                        <Link 
                          href="/signup" 
                          onClick={() => { setMode('signup'); setError(null) }}
                          className="font-bold text-[#EF3030] hover:underline"
                        >
                          Sign Up
                        </Link>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <Link 
                          href="/login" 
                          onClick={() => { setMode('login'); setError(null) }}
                          className="font-bold text-[#EF3030] hover:underline"
                        >
                          Sign In
                        </Link>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: 6-DIGIT OTP VERIFICATION SCREEN */}
              {step === 'otp' && (
                <motion.div 
                  key="otp-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-2xl text-[#111111] space-y-6"
                >
                  <div className="text-center space-y-1.5">
                    <h1 className="text-2xl font-bold text-[#111111]">Verify Your Number</h1>
                    <p className="text-sm text-[#666666]">
                      Enter the 6-digit OTP sent to{' '}
                      <span className="font-bold text-[#111111]">+91 {mobile}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-[#DC2626] text-xs font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    {/* 6 OTP Input Boxes */}
                    <div className="flex justify-between items-center space-x-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-12 h-14 text-center text-xl font-extrabold rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#EF3030] focus:border-[#EF3030] shadow-sm"
                        />
                      ))}
                    </div>

                    <LiquidButton
                      type="submit"
                      disabled={loading || otp.join('').length !== 6}
                      className="w-full"
                      icon={loading ? undefined : <ArrowRight className="w-4 h-4" />}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        "Verify OTP"
                      )}
                    </LiquidButton>
                  </form>

                  {/* Resend & Change Mobile Options */}
                  <div className="pt-2 text-center space-y-3 text-xs">
                    <div>
                      <span className="text-[#666666]">Didn't receive the OTP? </span>
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="font-bold text-[#EF3030] hover:underline inline-flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resend OTP</span>
                        </button>
                      ) : (
                        <span className="font-semibold text-[#999999]">
                          Resend OTP in {timer}s
                        </span>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('mobile')
                          setError(null)
                          setOtp(['', '', '', '', '', ''])
                        }}
                        className="text-[#666666] hover:text-[#111111] font-semibold inline-flex items-center space-x-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Change mobile number</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS STEP */}
              {step === 'success' && (
                <motion.div 
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-2xl text-center space-y-6 text-[#111111]"
                >
                  {/* GREEN CIRCLE WITH ANIMATED CHECK MARK */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-[#16A34A] text-white flex items-center justify-center mx-auto shadow-lg shadow-green-500/30"
                  >
                    <motion.svg
                      className="w-10 h-10 stroke-white stroke-[3.5]"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                      />
                    </motion.svg>
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight">
                      Verification Successful
                    </h2>
                    <p className="text-sm text-[#666666] max-w-xs mx-auto">
                      Your mobile number has been verified successfully.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
