'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { GoogleAuthButton } from './google-auth-button';
import { Mail, Lock, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setSubmitting(true);
    try {
      await login(data);
      toast.success('Successfully logged in!');
      setIsRedirecting(true);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Branding */}
      <div className="flex flex-col items-center md:items-start gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 flex-shrink-0">
            <img src="/logo.png" alt="Odyssey Logo" className="h-full w-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight pb-2 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent lowercase">
            odyssey
          </h1>
        </div>
        <p className="text-xs font-bold tracking-[0.15em] text-amber-600/90 dark:text-amber-500/90 uppercase text-center md:text-left">
          Your journey to the ideal job starts here
        </p>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5 text-center md:text-left mt-2">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          Welcome back
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your credentials to access your interview workspace.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
            />
          </div>
          {errors.email && (
            <span className="text-xs text-red-500 mt-0.5">{errors.email.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
            />
          </div>
          {errors.password && (
            <span className="text-xs text-red-500 mt-0.5">{errors.password.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-1">
        <div className="flex-grow border-t border-slate-100 dark:border-slate-800/80"></div>
        <span className="px-3 text-xs text-slate-400 uppercase tracking-widest font-semibold">Or</span>
        <div className="flex-grow border-t border-slate-100 dark:border-slate-800/80"></div>
      </div>

      {/* Google Login */}
      <GoogleAuthButton />

      {/* Link to Register */}
      <div className="text-center mt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Full Screen Loader Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
          <div className="relative flex items-center justify-center">
            {/* Outer rings */}
            <div className="absolute w-24 h-24 border-4 border-indigo-200 dark:border-indigo-900/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute w-16 h-16 border-4 border-t-indigo-600 border-r-indigo-600 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute w-12 h-12 border-4 border-t-transparent border-r-transparent border-b-indigo-400 border-l-indigo-400 rounded-full animate-[spin_1.5s_linear_reverse_infinite]"></div>
            
            {/* Center icon */}
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <Lock className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent animate-pulse">
              Authenticating
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Preparing your dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
