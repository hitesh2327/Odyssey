import React from 'react';
import Link from 'next/link';
import { LogoIcon } from '../ui/icons';

interface ProfileNavigationProps {
  initials: string;
}

export function ProfileNavigation({ initials }: ProfileNavigationProps) {
  return (
    <nav className="flex items-center justify-between px-10 py-[18px] bg-card border-b border-line max-sm:px-[18px] max-sm:py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded-full bg-ink flex items-center justify-center">
          <LogoIcon />
        </div>
        <div className="font-serif font-semibold text-[21px] tracking-[0.2px] text-ink">
          odyssey
        </div>
      </div>
      <div className="flex items-center gap-7 text-[14px] text-text-muted">
        <Link href="#" className="hover:text-ink transition-colors">Dashboard</Link>
        <Link href="#" className="hover:text-ink transition-colors">History</Link>
        <span className="font-medium text-text">Profile</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-harbor to-ink flex items-center justify-center text-white text-[13px] font-semibold font-sans">
          {initials}
        </div>
      </div>
    </nav>
  );
}
