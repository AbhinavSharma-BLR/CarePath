'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button';

const navItems = [
  { label: 'Doctor Referrals', href: '/doctor', icon: '👨‍⚕️' },
  { label: 'Hospital Reception', href: '/hospital', icon: '🏥' },
  { label: 'CARELINK Navigators', href: '/carelink', icon: '🧭' },
  { label: 'Admin Analytics', href: '/admin', icon: '📊' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-[#050505] p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-3">
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-2">
          Navigation Portals
        </div>
        <div className="space-y-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="block w-full">
                <LiquidMetalButton
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                  className="w-full justify-start text-left py-2.5 px-3.5 text-xs font-medium"
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-[#1F1F1F] rounded-xl border border-[#3F3F46] text-xs text-zinc-400 shadow-md">
        <p className="font-medium text-zinc-200 mb-1">CarePath+ Status</p>
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Fastify API & Socket.io Live
        </p>
      </div>
    </aside>
  );
}
