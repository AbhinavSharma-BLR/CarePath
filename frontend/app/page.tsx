import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { SpecialtiesGrid } from '@/components/landing/SpecialtiesGrid'
import { SecurityTrust } from '@/components/landing/SecurityTrust'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FAQAccordion } from '@/components/landing/FAQAccordion'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080808] text-white">
      <Navbar />
      <main className="flex-grow w-full">
        <HeroSection />
        <SpecialtiesGrid />
        <SecurityTrust />
        <HowItWorks />
        <FAQAccordion />
      </main>
      <Footer />
    </div>
  )
}
