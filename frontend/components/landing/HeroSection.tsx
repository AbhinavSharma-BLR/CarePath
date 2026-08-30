'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { 
  Video, 
  ShieldCheck, 
  ArrowRight, 
  UserCheck, 
  CheckCircle2, 
  Activity, 
  FileText, 
  Zap, 
  Sparkles 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LiquidButton } from '@/components/ui/button-1'

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const router = useRouter()

  // Lightweight Framer Motion variants using GPU transforms
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  }

  const floatAnimationLeft = shouldReduceMotion
    ? {}
    : {
        y: [0, -8, 0],
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      }

  const floatAnimationRight = shouldReduceMotion
    ? {}
    : {
        y: [0, 8, 0],
        transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
      }

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 bg-[#080808] text-white">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-red-600/15 via-red-900/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            
            {/* Trust badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-semibold">
              <UserCheck className="w-4 h-4 text-[#EF3030]" />
              <span>10,000+ Certified Doctors Available Online</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Healthcare at your{' '}
              <span className="text-[#EF3030]">
                fingertips
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-[#999999] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Book instant consultations, join virtual queueing, consult verified specialists over HD video, receive digital prescriptions, and manage medical records safely.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <LiquidButton
                onClick={() => router.push('/signup')}
                icon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto"
              >
                Book a Consultation
              </LiquidButton>
              <LiquidButton
                onClick={() => router.push('/doctors')}
                className="w-full sm:w-auto"
              >
                Browse Doctors
              </LiquidButton>
            </div>

            {/* Bullet features */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#2A2A2A]">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#999999]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>WebRTC Video Call</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-[#999999]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>Real-Time Queue</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-[#999999] col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>Encrypted Records</span>
              </div>
            </div>

          </div>

          {/* Right Hero Visual: Structured 3-Zone Medical Dashboard Layout */}
          <div className="lg:col-span-6 relative mt-6 lg:mt-0">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col space-y-4 max-w-lg lg:max-w-none mx-auto"
            >
              {/* ZONE A: TOP CARDS ROW (Flex row above doctor image) */}
              <div className="hidden sm:flex items-center justify-between gap-4 z-20">
                {/* Top-Left: AI Diagnostic Assist */}
                <motion.div
                  animate={floatAnimationLeft}
                  className="p-3 rounded-2xl bg-[#171717]/90 backdrop-blur-md border border-[#333333] shadow-xl flex items-center space-x-3 text-white"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#EF3030] text-white flex items-center justify-center shadow-md shadow-red-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-white">AI Diagnostic Assist</span>
                      <Zap className="w-3 h-3 text-[#EF3030] fill-[#EF3030]" />
                    </div>
                    <span className="text-[10px] text-[#999999]">Real-time clinical summary</span>
                  </div>
                </motion.div>

                {/* Top-Right: 78 BPM ECG Pulse */}
                <motion.div
                  animate={floatAnimationRight}
                  className="p-3 rounded-2xl bg-[#171717]/90 backdrop-blur-md border border-[#333333] shadow-xl flex items-center space-x-3 text-white"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-[#16A34A] flex items-center justify-center">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white">78 BPM</span>
                      <span className="text-[10px] text-[#16A34A] font-semibold">Normal</span>
                    </div>
                    <svg className="w-20 h-3 text-[#16A34A]" viewBox="0 0 100 20" fill="none">
                      <path
                        d="M0 10 H25 L30 2 L35 18 L40 5 L45 14 L50 10 H100"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </motion.div>
              </div>

              {/* ZONE B: CENTER DOCTOR IMAGE (Primary Visual Anchor - 100% Unobstructed) */}
              <div className="relative rounded-3xl overflow-hidden border border-[#2A2A2A] bg-[#111111] shadow-2xl shadow-red-950/30 aspect-[4/3] w-full z-10">
                <Image
                  src="/hero_doctor_visual.jpg"
                  alt="CarePath+ AI Telemedicine Doctor Consultation"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
                  className="object-cover rounded-3xl"
                />
                
                {/* Subtle Depth Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/50 via-transparent to-black/10 pointer-events-none" />
              </div>

              {/* ZONE C: BOTTOM CARDS ROW (Flex row below doctor image) */}
              <div className="hidden sm:grid grid-cols-12 gap-3 z-20">
                
                {/* Bottom-Left: Digital e-Prescription (Col 4) */}
                <motion.div
                  animate={floatAnimationLeft}
                  className="col-span-4 p-3 rounded-2xl bg-[#171717]/90 backdrop-blur-md border border-[#333333] shadow-xl flex items-center space-x-2.5 text-white"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#EF3030]/20 border border-[#EF3030]/40 text-[#EF3030] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">e-Prescription</span>
                    <span className="block text-[10px] text-[#999999] truncate">PDF & Mobile</span>
                  </div>
                </motion.div>

                {/* Bottom-Center: Live Virtual Clinic (Col 4) */}
                <motion.div
                  animate={floatAnimationLeft}
                  className="col-span-4 p-3 rounded-2xl bg-[#141414] border border-[#EF3030]/40 shadow-xl flex items-center justify-between space-x-2 text-white"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#EF3030]/20 text-[#EF3030] flex items-center justify-center flex-shrink-0">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate">Virtual Clinic</span>
                      <span className="block text-[10px] text-[#999999] truncate">HD Consultation</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#16A34A]/20 text-[#16A34A] text-[9px] font-bold flex-shrink-0">
                    ONLINE
                  </span>
                </motion.div>

                {/* Bottom-Right: 256-Bit Encrypted Security (Col 4) */}
                <motion.div
                  animate={floatAnimationRight}
                  className="col-span-4 p-3 rounded-2xl bg-[#171717]/90 backdrop-blur-md border border-[#333333] shadow-xl flex items-center space-x-2.5 text-white"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-[#16A34A] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">Encrypted</span>
                    <span className="block text-[10px] text-[#16A34A] font-semibold truncate">HIPAA Compliant</span>
                  </div>
                </motion.div>

              </div>

              {/* Mobile Fallback Grid (sm:hidden) */}
              <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center space-x-2">
                  <Video className="w-4 h-4 text-[#EF3030] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">Virtual Clinic</span>
                    <span className="block text-[10px] text-[#16A34A] truncate">Online Now</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#EF3030] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">AI Diagnostic</span>
                    <span className="block text-[10px] text-[#999999] truncate">Clinical Assist</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#EF3030] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">e-Prescription</span>
                    <span className="block text-[10px] text-[#999999] truncate">PDF & Mobile</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">256-Bit Secure</span>
                    <span className="block text-[10px] text-[#16A34A] truncate">HIPAA Compliant</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
