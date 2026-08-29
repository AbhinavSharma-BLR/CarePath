import { UserPlus, Search, Video, FileText } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Register & Complete Profile',
      desc: 'Create your secure CarePath+ patient profile in 2 minutes. Enter basic health history, allergies, and emergency contact details.',
      icon: UserPlus,
    },
    {
      num: '02',
      title: 'Find Doctor & Select Slot',
      desc: 'Search by specialty, language, or availability. Choose an instant queue token or schedule a convenient time slot.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Join Virtual Queue & Video Call',
      desc: 'Watch your real-time queue position. When the doctor calls, connect via browser WebRTC video with built-in live chat.',
      icon: Video,
    },
    {
      num: '04',
      title: 'Receive e-Prescription & Follow-up',
      desc: 'Get your official digital prescription, review clinical notes, download PDFs, and schedule follow-ups seamlessly.',
      icon: FileText,
    },
  ]

  return (
    <section id="how-it-works" className="scroll-mt-24 md:scroll-mt-28 py-20 bg-[#080808] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-extrabold uppercase tracking-wider">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            How CarePath+ Works
          </h2>
          <p className="text-base text-[#D1D5DB] max-w-2xl mx-auto leading-relaxed">
            Designed for frictionless care — connecting patients to doctors without complex paperwork or unnecessary waiting.
          </p>
        </div>

        {/* 4 Steps Grid (White Cards with Dark Text) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 relative flex flex-col justify-between border border-[#E5E7EB] hover:shadow-lg hover:border-red-300 transition-all group text-[#111111]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#EF3030] border border-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-[#111111]">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#111111] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
