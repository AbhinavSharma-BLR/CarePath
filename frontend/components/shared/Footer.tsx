import Link from 'next/link'
import { Activity, ShieldCheck } from 'lucide-react'
import { CarePathLogo } from '@/components/brand/carepath-logo'

export function Footer() {
  return (
    <footer className="bg-[#080808] text-[#999999] border-t border-[#2A2A2A] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center mb-2">
              <CarePathLogo size="sm" showTagline={false} />
            </Link>
            <p className="text-sm text-[#999999] leading-relaxed">
              Patient-controlled digital healthcare platform delivering seamless telemedicine, virtual queues, audio/video consultations, and digital e-prescriptions.
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#999999] pt-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>HIPAA Compliant & Encrypted Data</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/doctors" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Find Doctors</Link>
              </li>
              <li>
                <Link href="/#services" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Specialties</Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">How it Works</Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Patient Registration</Link>
              </li>
              <li>
                <Link href="/auth/register?role=doctor" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Doctor Join</Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/patient/dashboard" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Patient Dashboard</Link>
              </li>
              <li>
                <Link href="/doctor/dashboard" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Doctor Workspace</Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Admin Portal</Link>
              </li>
              <li>
                <Link href="/patient/records" className="text-[#D4D4D4] hover:text-[#EF3030] transition-colors">Medical Records</Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support & Emergency</h4>
            <p className="text-xs text-[#999999] mb-3 leading-relaxed">
              CarePath+ provides non-emergency telemedicine care. For critical emergencies, call immediate emergency response.
            </p>
            <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2A2A2A] text-xs">
              <span className="block font-semibold text-[#EF3030] mb-1">🚨 Emergency Services</span>
              <span className="text-[#D4D4D4]">National Emergency: 112 / 108</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-[#999999] space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} CarePath+ Telemedicine. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/#security" className="text-[#D4D4D4] hover:text-[#EF3030]">Privacy Policy</Link>
            <Link href="/#security" className="text-[#D4D4D4] hover:text-[#EF3030]">Terms of Service</Link>
            <Link href="/#faq" className="text-[#D4D4D4] hover:text-[#EF3030]">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
