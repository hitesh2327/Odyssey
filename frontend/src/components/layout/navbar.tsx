'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserCircle, LogOut, ChevronDown, User } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Odyssey Logo" className="h-full w-auto object-contain drop-shadow-sm" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight pb-1 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent lowercase">odyssey</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link 
                  href="/history" 
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/history' 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400'
                  }`}
                >
                  History
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-2 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      pathname === '/profile'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <UserCircle className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      
                      <Link 
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors w-full text-left ${
                          pathname === '/profile'
                            ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/10 font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>

                      <div className="flex items-center justify-between px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">Theme</span>
                        <ThemeToggle />
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/80 mt-1 pt-1">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full text-left font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
