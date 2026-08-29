'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Activity, MailCheck, ArrowRight } from 'lucide-react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

  return (
    <div className="w-full max-w-md space-y-6">
      <Link href="/" className="inline-flex items-center space-x-2">
        <div className="w-12 h-12 rounded-xl bg-[#EF3030] flex items-center justify-center text-white shadow-md shadow-red-500/20">
          <Activity className="w-7 h-7" />
        </div>
      </Link>

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#E5E5E5] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#16A34A] mx-auto flex items-center justify-center">
          <MailCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-white">
          Check Your Email
        </h2>

        <p className="text-sm text-[#666666] dark:text-neutral-300 leading-relaxed">
          We have sent a verification link to <strong className="text-[#111111] dark:text-white">{email}</strong>. Please click the link to confirm your account and sign in.
        </p>

        <div className="pt-4 border-t border-[#E5E5E5] dark:border-neutral-800">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-semibold text-sm shadow-md shadow-red-500/20"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F7F7] dark:bg-neutral-950 text-center">
      <Suspense fallback={<div className="loader" />}>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
