'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleAuthButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const res = await authService.googleAuth(response.credential);
        if (res && res.success && res.user) {
          setUser(res.user);
          toast.success('Successfully logged in with Google!');
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
    <div className="w-full flex justify-center py-2 relative z-20">
      <div ref={buttonRef} className="w-full max-w-xs" />
    </div>
  );
}
