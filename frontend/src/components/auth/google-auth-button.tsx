'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { Lock } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleAuthButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const res = await authService.googleAuth(response.credential);
        if (res && res.success && res.user) {
          setUser(res.user);
          toast.success('Successfully logged in with Google!');
          setIsRedirecting(true);
          router.push('/dashboard');
        } else {
          throw new Error('Authentication failed');
        }
      } catch (err: any) {
        toast.error(err.message || 'Google Sign-In failed');
      }
    };

    const initializeGoogle = () => {
      if (!window.google) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: buttonRef.current.clientWidth || 320,
        });
      }
    };

    // Dynamically inject the Google client SDK if not already present
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, [setUser, router]);

  return (
    <>
      <div className="w-full flex justify-center py-2 relative z-20">
        <div ref={buttonRef} className="w-full max-w-xs" />
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
    </>
  );
}
