'use client';

import React from 'react';
import { AuthHero } from './auth-hero';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:grid md:grid-cols-12 bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col justify-center items-center col-span-12 md:col-span-6 lg:col-span-5 px-6 py-12 md:px-16 min-h-screen">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-8 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none transition-all">
          {children}
        </div>
      </div>
      <div className="hidden md:flex md:col-span-6 lg:col-span-7 justify-center items-center bg-slate-900 overflow-hidden relative min-h-screen p-12">
        <AuthHero />
      </div>
    </div>
  );
}
