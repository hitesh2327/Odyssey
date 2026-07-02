import React from 'react';
import { Sidebar } from '@/components/shell/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-parchment text-text font-sans selection:bg-brass-tint selection:text-brass-deep">
      <Sidebar />
      <main className="flex-1 min-w-0 p-[26px_24px_60px] lg:p-[36px_44px_70px] max-w-full lg:max-w-[1140px] mx-auto">
        {children}
      </main>
    </div>
  );
}
