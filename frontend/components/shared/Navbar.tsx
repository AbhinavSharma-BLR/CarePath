'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Activity, Menu, X, User, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LiquidButton } from '@/components/ui/button-1'
import { CarePathLogo } from '@/components/brand/carepath-logo'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-md border-b border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center">
            <CarePathLogo size="sm" showTagline={true} />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-white">
            <Link href="/#services" className="hover:text-[#EF3030] transition-colors">
              Services
            </Link>
            <Link href="/doctors" className="hover:text-[#EF3030] transition-colors">
              Doctors
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#EF3030] transition-colors">
              How it Works
            </Link>
            <Link href="/#security" className="hover:text-[#EF3030] transition-colors">
              Security
            </Link>
            <Link href="/#faq" className="hover:text-[#EF3030] transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-white hover:text-[#EF3030] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <LiquidButton
              onClick={() => router.push('/signup')}
              icon={<User className="w-4 h-4" />}
            >
              Book Consultation
            </LiquidButton>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-white hover:bg-[#171717]"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#111111] border-t border-[#2A2A2A] px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/#services"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-[#171717]"
          >
            Services
          </Link>
          <Link
            href="/doctors"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-[#171717]"
          >
            Doctors
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-[#171717]"
          >
            How it Works
          </Link>
          <Link
            href="/#security"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-[#171717]"
          >
            Security
          </Link>
          <Link
            href="/#faq"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-[#171717]"
          >
            FAQ
          </Link>

          <div className="pt-4 border-t border-[#2A2A2A] flex flex-col space-y-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-xl border border-[#2A2A2A] font-medium text-white bg-[#171717]"
            >
              Login
            </Link>
            <LiquidButton
              onClick={() => {
                setIsOpen(false)
                router.push('/signup')
              }}
              className="w-full"
            >
              Book Consultation
            </LiquidButton>
          </div>
        </div>
      )}
    </header>
  )
}
