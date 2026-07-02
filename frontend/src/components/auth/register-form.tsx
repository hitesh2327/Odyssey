'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { GoogleAuthButton } from './google-auth-button';
import { OtpInput } from '../ui/otp-input';
import { User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterSchemaType = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [registeredUser, setRegisteredUser] = useState<{ userId: string; email: string } | null>(null);
  const [otp, setOtp] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    setSubmitting(true);
    try {
      const { name, email, password } = data;
      const res = await registerUser({ name, email, password });
      
      if (res && res.requiresVerification) {
        setRegisteredUser({ userId: res.userId, email: res.email });
        setStep('otp');
        toast.success('Registration successful! Please verify your email.');
      } else {
        toast.success('Account created successfully!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const verifyRes = await authService.verifyEmail(registeredUser!.userId, otp);
      if (verifyRes && verifyRes.user) {
        setUser(verifyRes.user);
        toast.success('Email verified successfully! Welcome to Odyssey.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!registeredUser) return;
    setResending(true);
    try {
      await authService.resendOtp(registeredUser.userId);
      toast.success('Verification code resent successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  if (step === 'otp' && registeredUser) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Back Button */}
        <button
          onClick={() => setStep('register')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to registration
        </button>

        {/* Title */}
        <div className="flex flex-col gap-1.5 text-center md:text-left">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Verify your email
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We sent a 6-digit verification code to <span className="font-semibold text-slate-700 dark:text-slate-300">{registeredUser.email}</span>.
          </p>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={verifying}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        {/* Resend Code Link */}
        <div className="text-center mt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Resending...' : 'Resend code'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="flex flex-col gap-1.5 text-center md:text-left">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create an account
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Get started with your AI-powered interview prep today.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Amélie Laurent"
              {...register('name')}
              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
            />
          </div>
          {errors.name && (
            <span className="text-xs text-red-500 mt-0.5">{errors.name.message}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="amelie@example.com"
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
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              placeholder="Minimum 8 characters"
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

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              placeholder="Repeat your password"
              {...register('confirmPassword')}
              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                errors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-red-500 mt-0.5">{errors.confirmPassword.message}</span>
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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-1">
        <div className="flex-grow border-t border-slate-100 dark:border-slate-800/80"></div>
        <span className="px-3 text-xs text-slate-400 uppercase tracking-widest font-semibold">Or</span>
        <div className="flex-grow border-t border-slate-100 dark:border-slate-800/80"></div>
      </div>

      {/* Google Sign In */}
      <GoogleAuthButton />

      {/* Link to Login */}
      <div className="text-center mt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
