'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const faqs = [
    {
      q: 'How does the CarePath+ virtual queue work?',
      a: 'After requesting an instant consultation, you receive a digital token position. Your dashboard updates in real-time as the doctor sees preceding patients. When it is your turn, you receive an instant audio/push notification to join the HD video call.',
    },
    {
      q: 'Can I receive valid prescriptions on CarePath+?',
      a: 'Yes. Following your consultation, your verified doctor generates a digital e-prescription with medicine names, dosage, frequency, and advice. You can view, download as a PDF, or access it from your history at any time.',
    },
    {
      q: 'Is CarePath+ free for patients?',
      a: 'Registering an account and creating your medical profile is completely free. Consultation fees vary depending on the chosen doctor or public healthcare facility.',
    },
    {
      q: 'Who can access my uploaded medical records?',
      a: 'Only you and the doctor assigned to your active consultation can access your records. Records are stored securely with Row Level Security and private signed URLs.',
    },
    {
      q: 'What should I do in a medical emergency?',
      a: 'CarePath+ is designed for non-emergency telemedicine. In case of a life-threatening medical emergency (such as severe chest pain or stroke), call national emergency services (112 / 108) immediately.',
    },
  ]

  return (
    <section id="faq" className="scroll-mt-24 md:scroll-mt-28 py-20 bg-[#080808] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14 space-y-3">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-extrabold uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordions (White Cards with Dark Text) */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden transition-all shadow-sm text-[#111111]"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center space-x-4 focus:outline-none"
                >
                  <span className="font-bold text-base text-[#111111]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180 text-[#EF3030]' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-[#4B5563] border-t border-[#E5E7EB] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
