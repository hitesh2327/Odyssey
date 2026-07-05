import React, { useState } from 'react';
import { ApiProfile } from '../../types/profile';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { OtpInput } from '../ui/otp-input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AccountSecurityCardProps {
  profile: ApiProfile;
}

export function AccountSecurityCard({ profile }: AccountSecurityCardProps) {
  const setUser = useAuthStore((state) => state.setUser);
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = newEmail.trim().toLowerCase();
    if (!emailLower || !emailLower.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (emailLower === profile.user.email.toLowerCase()) {
      toast.error('New email must be different from current email');
      return;
    }

    setSubmitting(true);
    try {
      await authService.changeEmailRequest(emailLower);
      setEmailStep('verify');
      toast.success('Verification code sent to your new email.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request email change.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await authService.changeEmailVerify(otp);
      if (res && res.user) {
        setUser(res.user);
        toast.success('Email updated successfully!');
        setIsEmailModalOpen(false);
        // Reset states
        setNewEmail('');
        setOtp('');
        setEmailStep('request');
        // Reload page to reflect change across all components
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setIsEmailModalOpen(false);
    setNewEmail('');
    setOtp('');
    setEmailStep('request');
  };

  return (
    <>
      <div className="bg-card border border-line rounded-[16px] p-[26px_28px] mt-[22px]">
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-serif text-[19px] font-semibold text-ink m-0 flex items-center gap-[9px]">
            Account & Security
          </p>
        </div>

        <div className="flex items-center justify-between py-[13px] border-b border-line">
          <div>
            <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint mb-[3px]">
              Email
            </p>
            <p className="text-[14.5px] font-medium text-text m-0">
              {profile.user.email}
            </p>
          </div>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="text-text-faint hover:text-harbor focus:outline-none focus:ring-2 focus:ring-harbor rounded px-1 -mx-1 cursor-pointer transition-colors"
            aria-label="Edit Email"
          >
            ✎
          </button>
        </div>

        <div className="flex items-center justify-between py-[13px] border-b border-line">
          <div>
            <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint mb-[3px]">
              Password
            </p>
            <p className="text-[14.5px] font-medium text-text m-0">
              Last changed 2 months ago
            </p>
          </div>
          <Link href="/forgot-password">
            <Button variant="ghost">Change</Button>
          </Link>
        </div>

        <div className="flex items-center justify-between py-[13px] pb-0">
          <div>
            <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint mb-[3px]">
              Reminder Emails
            </p>
            <p className="text-[14.5px] font-medium text-text m-0">
              Before each scheduled session
            </p>
          </div>
          <button
            type="button"
            className="w-[38px] h-[22px] rounded-[20px] bg-sea relative cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea"
            aria-label="Toggle reminder emails"
          >
            <span className="absolute top-[2px] right-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      <div className="bg-card border border-line rounded-[16px] p-[18px_28px] mt-[22px]">
        <button className="text-[13px] text-coral font-semibold cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral rounded">
          Delete account
        </button>
      </div>

      {/* Edit Email Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={handleClose}
        title="Change Email Address"
        className="max-w-md"
      >
        {emailStep === 'request' ? (
          <form onSubmit={handleRequestChange} className="flex flex-col gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your new email address below. We will send a 6-digit OTP verification code to confirm ownership.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Email Address
              </label>
              <input
                type="email"
                placeholder="new-email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex justify-end gap-2.5 mt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="brass" disabled={submitting || !newEmail}>
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Sending OTP...
                  </>
                ) : (
                  'Send Code'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyChange} className="flex flex-col gap-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter the 6-digit verification code sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{newEmail}</span>.
            </p>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={verifying}
            />
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={() => setEmailStep('request')}
                disabled={verifying}
                className="text-xs text-indigo-600 hover:underline cursor-pointer disabled:opacity-50"
              >
                Change email
              </button>
              <div className="flex gap-2.5">
                <Button type="button" variant="outline" onClick={handleClose} disabled={verifying}>
                  Cancel
                </Button>
                <Button type="submit" variant="brass" disabled={verifying || otp.length !== 6}>
                  {verifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Change'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
