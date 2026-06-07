'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import { LogOut, Sparkles, User, Award, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 px-6 py-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">Odyssey Prep</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 max-w-4xl mx-auto w-full">
        {/* Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          {/* Background glowing decorations */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left: Avatar Column */}
          <div className="flex flex-col items-center">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full border-2 border-indigo-500/30 object-cover shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-center items-center text-slate-400">
                <User className="w-10 h-10" />
              </div>
            )}
            <span className="mt-3 text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {user?.provider || 'local'} Account
            </span>
          </div>

          {/* Right: Content Column */}
          <div className="flex-1 flex flex-col gap-5 text-center md:text-left">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome, {user?.name || 'Candidate'}!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                You are successfully authenticated. Welcome to your interview preparation workspace dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-500 mt-0.5" />
                <div className="flex flex-col text-left">
                  <span className="text-xs text-slate-400 font-semibold">Security Protocol</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">HttpOnly Session Verified</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex items-start gap-3">
                <Award className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div className="flex flex-col text-left">
                  <span className="text-xs text-slate-400 font-semibold">Email Verification</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {user?.isEmailVerified ? 'Email Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
