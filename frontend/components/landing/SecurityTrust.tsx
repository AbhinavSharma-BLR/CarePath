import { ShieldCheck, Lock, FileLock, UserCheck } from 'lucide-react'

export function SecurityTrust() {
  const securityFeatures = [
    {
      title: 'Row Level Security (RLS)',
      desc: 'Database permissions guarantee that only authorized patients and assigned doctors can access your health records.',
      icon: Lock,
      isGreen: false,
    },
    {
      title: 'Private File Storage',
      desc: 'Medical reports and prescriptions are stored in private storage buckets with time-limited signed access URLs.',
      icon: FileLock,
      isGreen: false,
    },
    {
      title: 'Verified Medical Doctors',
      desc: 'Every medical practitioner undergoes credential verification (license number & medical council registry check).',
      icon: UserCheck,
      isGreen: false,
    },
    {
      title: 'Encrypted Communication',
      desc: 'WebRTC video streams and chat messages use peer-to-peer end-to-end encryption protocols.',
      icon: ShieldCheck,
      isGreen: true,
    },
  ]

  return (
    <section id="security" className="scroll-mt-24 md:scroll-mt-28 py-20 bg-[#080808] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-extrabold uppercase tracking-wider">
            Privacy & Trust First
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            Built for Maximum Security
          </h2>
          <p className="text-base text-[#D1D5DB] max-w-2xl mx-auto leading-relaxed">
            CarePath+ handles sensitive medical data with enterprise-grade security architecture, compliance standards, and strict patient consent.
          </p>
        </div>

        {/* Security Cards (White Cards with Dark Text) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:border-red-300 transition-all text-[#111111]"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  sec.isGreen 
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-100'
                    : 'bg-[#FEE2E2] text-[#EF3030] border border-red-100'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">{sec.title}</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{sec.desc}</p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
