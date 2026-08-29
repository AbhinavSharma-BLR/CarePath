'use client'

import dynamic from 'next/dynamic'

const SignInPage = dynamic(
  () => import('@/components/ui/sign-in-flow-1').then((mod) => mod.SignInPage),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white font-medium">
        Loading CarePath+ Auth...
      </div>
    ),
  }
)

export default function LoginPage() {
  return <SignInPage initialMode="login" />
}
