export type OtpType = 'verify_email' | 'change_email' | 'reset_password';

export interface OtpRecord {
  otp: string;
  attempts: number;
  createdAt: string;
  newEmail?: string;
}

export interface LockRecord {
  lockedAt: string;
  reason: 'max_attempts' | 'max_resends';
  resendCount: number;
}
