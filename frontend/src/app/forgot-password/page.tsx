'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { AuthLayout } from '../../components/auth/auth-layout';
import { OtpInput } from '../../components/ui/otp-input';
import { Mail, Lock, Loader2, ArrowLeft, KeyRound } from 'lucide-react';

const requestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim(),
});

const resetSchema = z
  .object({
    otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RequestSchemaType = z.infer<typeof requestSchema>;
type ResetSchemaType = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // Form 1: Request OTP
  const {
    register: registerReq,
    handleSubmit: handleSubmitReq,
    formState: { errors: errorsReq },
  } = useForm<RequestSchemaType>({
    resolver: zodResolver(requestSchema),
  });

  // Form 2: Reset Password with OTP
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
    setValue: setValueReset,
    watch: watchReset,
  } = useForm<ResetSchemaType>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const otpValue = watchReset('otp');

  const onRequestSubmit = async (data: RequestSchemaType) => {
    setSubmitting(true);
    try {
      await authService.forgotPassword(data.email);
      setEmail(data.email);
      setStep('reset');
      toast.success('If the account exists, an OTP code has been sent!');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onResetSubmit = async (data: ResetSchemaType) => {
    setSubmitting(true);
    try {
      await authService.resetPassword({
        email,
        otp: data.otp,
        password: data.password,
      });
      toast.success('Password reset successfully! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resetPasswordResend(email);
      toast.success('Password reset OTP code resent successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 w-full">
        {step === 'request' ? (
          <>
            {/* Back Button */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>

            {/* Title */}
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 self-center md:self-start">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Forgot password?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No worries, we'll send you code instructions to reset it.
              </p>
            </div>

            {/* Request Form */}
            <form onSubmit={handleSubmitReq(onRequestSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...registerReq('email')}
                    className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                      errorsReq.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
                  />
                </div>
                {errorsReq.email && (
                  <span className="text-xs text-red-500 mt-0.5">{errorsReq.email.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setStep('request')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {/* Title */}
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Reset your password
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We sent a 6-digit password reset code to <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>.
              </p>
            </div>

            {/* Reset Form */}
            <form onSubmit={handleSubmitReset(onResetSubmit)} className="flex flex-col gap-4">
              {/* OTP Input */}
              <div className="flex flex-col gap-2.5 items-center my-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 self-start">
                  Enter 6-digit Code
                </label>
                <OtpInput
                  value={otpValue}
                  onChange={(val) => setValueReset('otp', val, { shouldValidate: true })}
                  disabled={submitting}
                />
                {errorsReset.otp && (
                  <span className="text-xs text-red-500 mt-0.5">{errorsReset.otp.message}</span>
                )}
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    {...registerReset('password')}
                    className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                      errorsReset.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
                  />
                </div>
                {errorsReset.password && (
                  <span className="text-xs text-red-500 mt-0.5">{errorsReset.password.message}</span>
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
                    {...registerReset('confirmPassword')}
                    className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border ${
                      errorsReset.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all`}
                  />
                </div>
                {errorsReset.confirmPassword && (
                  <span className="text-xs text-red-500 mt-0.5">{errorsReset.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || otpValue.length !== 6}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Resend Link */}
            <div className="text-center mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend code'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
