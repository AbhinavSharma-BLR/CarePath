'use client';

import Link from 'next/link';
import { CarePathLogo } from '@/components/brand/carepath-logo';
import { useAuthStore } from '@/stores/authStore';

export function Header({ title }: { title: string }) {
  const { user, clearAuth } = useAuthStore();

  return (
    <header className="h-16 border-b border-zinc-800 bg-[#050505]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:opacity-90 transition">
          <CarePathLogo variant="compact" size="sm" showTagline={false} />
        </Link>
        <div className="h-5 w-px bg-zinc-800 hidden sm:block"></div>
        <h1 className="font-semibold text-sm sm:text-base text-zinc-200 hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-zinc-400 capitalize">{user.role.toLowerCase().replace('_', ' ')}</div>
            </div>

            <button
              onClick={clearAuth}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-xs text-zinc-300 hover:text-white transition">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
