'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Toaster } from 'react-hot-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-white border dark:border-slate-800 text-sm rounded-xl',
          duration: 4000,
        }}
      />
    </>
  );
}
