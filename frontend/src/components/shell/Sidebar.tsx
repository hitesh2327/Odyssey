'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogoIcon, DashboardIcon, ProfileIcon, HistoryIcon, SettingsIcon } from '../ui/icons';
import { useProfile } from '@/hooks/use-profile';
import { useAuthStore } from '../../store/auth.store';
import { LogOut } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { data: profile } = useProfile();
  
  const initials = profile?.user?.name?.charAt(0).toUpperCase() || 'O';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'Profile', href: '/profile', icon: ProfileIcon },
    { name: 'History', href: '/history', icon: HistoryIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="w-full lg:w-[248px] shrink-0 bg-ink flex flex-col lg:h-screen lg:sticky lg:top-0 p-[14px_18px] lg:p-[24px_18px] lg:gap-0 gap-[18px] flex-row lg:flex-col items-center lg:items-stretch overflow-x-auto lg:overflow-x-visible z-30">
      <div className="flex items-center gap-[10px] lg:p-[0_8px_26px] p-0 shrink-0">
        <div className="w-[32px] h-[32px] rounded-full border border-[#E4C895] flex items-center justify-center shrink-0">
          <LogoIcon />
        </div>
        <span className="font-serif text-[18px] font-semibold text-white tracking-[0.02em] lowercase">
          odyssey
        </span>
      </div>

      <nav className="flex lg:flex-col gap-[7px] flex-row">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-[12px] p-[10px_12px] rounded-[10px] text-[14px] font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-ink-soft text-white'
                  : 'text-[#8C93B6] hover:text-white hover:bg-ink-soft/40'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-brass rounded-r-[3px]" />
              )}
              <Icon className="shrink-0" />
              <span className="hidden lg:block">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block flex-1" />

      <div className="hidden lg:block">
        <button
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
          className="flex items-center gap-[10px] text-[13px] font-semibold text-[#8C93B6] p-[10px_14px] m-0 w-full text-left focus:outline-none cursor-pointer transition-colors bg-ink-soft/40 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-[10px] group"
        >
          <LogOut className="w-4 h-4 shrink-0 text-[#8C93B6] group-hover:text-red-400 transition-colors" />
          <span>Sign Out</span>
        </button>

        <div className="bg-ink-soft rounded-[12px] p-[13px_14px] flex items-center gap-[11px] cursor-pointer mt-[8px] hover:bg-[#343e6a] transition-colors focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1 focus:ring-offset-ink" tabIndex={0}>
          <div className="w-[36px] h-[36px] rounded-full bg-harbor flex items-center justify-center text-white font-serif font-semibold text-[15px] shrink-0 border-[2px] border-[#E4C895]">
            {initials}
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-white">
              {profile?.user.name || 'Crew Member'}
            </div>
            <div className="font-mono text-[11px] text-[#E4C895] mt-[2px]">
              ⚓ Day {profile?.profile.streakDays || 0} streak
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
