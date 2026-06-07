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
import { User, Mail, Lock, Loader2 } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);

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
      // Exclude confirmPassword from data passed to API
      const { name, email, password } = data;
      await registerUser({ name, email, password });
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

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
