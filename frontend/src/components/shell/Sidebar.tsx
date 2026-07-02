'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoIcon, DashboardIcon, ProfileIcon, HistoryIcon, SettingsIcon } from '../ui/icons';
import { useProfile } from '@/hooks/use-profile';

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

  return (
    <div className="w-full lg:w-[248px] shrink-0 bg-ink flex flex-col lg:h-screen lg:sticky lg:top-0 p-[14px_18px] lg:p-[24px_18px] lg:gap-0 gap-[18px] flex-row lg:flex-col items-center lg:items-stretch overflow-x-auto lg:overflow-x-visible z-30">
      <div className="flex items-center gap-[10px] lg:p-[0_8px_26px] p-0 shrink-0">
        <div className="w-[32px] h-[32px] rounded-full border border-[#E4C895] flex items-center justify-center shrink-0">
          <LogoIcon />
        </div>
        <div className="font-serif font-semibold text-[19px] text-white hidden lg:block">
          odyssey
        </div>
      </div>

      <nav className="flex lg:flex-col flex-row gap-[2px] w-full items-center lg:items-stretch lg:flex-none flex-1 lg:flex-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-[12px] p-[11px_12px] rounded-[9px] text-[14px] font-medium relative cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1 focus:ring-offset-ink shrink-0 ${
                isActive
                  ? 'bg-[rgba(184,134,59,0.16)] text-white'
                  : 'text-[#9BA0C2] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
              }`}
            >
              {isActive && (
                <span className="hidden lg:block absolute left-[-18px] top-[8px] bottom-[8px] w-[3px] bg-brass rounded-[2px]" />
              )}
              <Icon className="shrink-0" />
              <span className="hidden lg:block">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block flex-1" />

      <div className="hidden lg:block">
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#666C8C] p-[18px_12px_8px] m-0">
          Crew Member
        </p>

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
