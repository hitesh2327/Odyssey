import React from 'react';
import { ApiProfile } from '../../types/profile';
import { Button } from '../ui/button';

interface AccountSecurityCardProps {
  profile: ApiProfile;
}

export function AccountSecurityCard({ profile }: AccountSecurityCardProps) {
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
            className="text-text-faint hover:text-harbor focus:outline-none focus:ring-2 focus:ring-harbor rounded px-1 -mx-1"
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
          <Button variant="ghost">Change</Button>
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
    </>
  );
}
