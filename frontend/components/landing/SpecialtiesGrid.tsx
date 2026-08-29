import Link from 'next/link'
import { Heart, Sparkles, Stethoscope, Baby, Bone, Brain } from 'lucide-react'

export function SpecialtiesGrid() {
  const specialties = [
    {
      name: 'General Medicine',
      desc: 'Fever, cold, blood pressure, diabetes, fatigue & routine checkups.',
      icon: Stethoscope,
      doctorsCount: '120+ Doctors',
    },
    {
      name: 'Dermatology',
      desc: 'Skin concerns, rash, acne, hair fall, allergies & cosmetic advice.',
      icon: Sparkles,
      doctorsCount: '85+ Doctors',
    },
    {
      name: 'Cardiology',
      desc: 'Heart health, chest discomfort, ECG review, lipid disorders.',
      icon: Heart,
      doctorsCount: '45+ Doctors',
    },
    {
      name: 'Pediatrics',
      desc: 'Child healthcare, vaccinations, growth monitoring & childhood fever.',
      icon: Baby,
      doctorsCount: '60+ Doctors',
    },
    {
      name: 'Neurology',
      desc: 'Headaches, migraines, dizziness, nerve pain & sleep disorders.',
      icon: Brain,
      doctorsCount: '30+ Doctors',
    },
    {
      name: 'Orthopedics',
      desc: 'Joint pain, fractures, arthritis, back pain & sports injuries.',
      icon: Bone,
      doctorsCount: '50+ Doctors',
    },
  ]

  return (
    <section id="services" className="scroll-mt-24 md:scroll-mt-28 py-20 bg-[#080808] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (White text on Black page) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 space-y-4 md:space-y-0">
          <div>
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-bold uppercase tracking-wider">
              Expert Clinical Specialties
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
              Find Care by Specialty
            </h2>
          </div>
          <Link
            href="/doctors"
            className="text-sm font-semibold text-[#EF3030] hover:text-[#D92727] flex items-center space-x-1"
          >
            <span>View All Specialties & Doctors →</span>
          </Link>
        </div>

        {/* Specialty Cards (White Cards with Dark Text) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((spec, idx) => {
            const Icon = spec.icon
            return (
              <Link
                key={idx}
                href={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
                className="bg-white rounded-2xl p-6 border border-[#E5E7EB] hover:shadow-xl hover:border-red-300 transition-all group block text-[#111111]"
              >
                {/* Header: Icon & Doctor Count */}
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#EF3030] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F5F5F5] text-[#4B5563] border border-[#E5E7EB]">
                    {spec.doctorsCount}
                  </span>
                </div>

                {/* Specialty Title (Explicit #111111, NO dark mode override) */}
                <h3 className="text-xl font-bold text-[#111111] group-hover:text-[#EF3030] transition-colors mb-2">
                  {spec.name}
                </h3>

                {/* Specialty Description (Explicit #6B7280, NO dark mode override) */}
                <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                  {spec.desc}
                </p>

                {/* Divider & CTA */}
                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs font-bold text-[#EF3030]">
                  <span>Consult Now</span>
                  <span className="group-hover:translate-x-1 transition-transform text-sm">→</span>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}
