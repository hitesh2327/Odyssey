'use client';

import React from 'react';
import { ApiProfile } from '../../types/profile';
import { DocumentCard } from '../ui/DocumentCard';
import { Button } from '../ui/button';
import { useProfileModal } from './ProfileModalContext';
import { format } from 'date-fns';

interface ProfilePassportHeaderProps {
  profile: ApiProfile;
}

export function ProfilePassportHeader({ profile }: ProfilePassportHeaderProps) {
  const { openModal } = useProfileModal();
  const initials = profile?.user?.name?.charAt(0).toUpperCase() || 'O';
  const avatarUrl = profile?.user?.avatarUrl;

  return (
    <DocumentCard>
      <div className="flex items-center justify-between px-[26px] py-[14px] border-b border-dashed border-line-strong">
        <span className="font-mono text-[11px] tracking-[0.1em] text-brass-deep uppercase">
          Voyage Log · No. 04471
        </span>
        <Button variant="stamp" onClick={openModal}>
          ✎ Edit Details
        </Button>
      </div>

      <div className="flex items-center gap-[30px] px-[30px] py-[28px] max-sm:flex-col max-sm:items-start">
        <div className="shrink-0 relative w-[124px] h-[124px]">
          <svg width="124" height="124" viewBox="0 0 124 124">
            <defs>
              <path
                id="ring"
                d="M62,62 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0"
              />
            </defs>
            <circle
              cx="62"
              cy="62"
              r="58"
              fill="none"
              stroke="#E4C895"
              strokeWidth="0.7"
              strokeDasharray="1 3.5"
            />
            <text
              fontFamily="var(--font-ibm-plex-mono)"
              fontSize="7.2"
              fill="#B8863B"
              letterSpacing="2.6"
            >
              <textPath href="#ring" startOffset="2%">
                ODYSSEY · CREW MEMBER · ODYSSEY · CREW MEMBER ·
              </textPath>
            </text>
            <circle
              cx="62"
              cy="62"
              r="43"
              fill="#2F5C8A"
              stroke="#161B33"
              strokeWidth="3"
            />
          </svg>
          {avatarUrl ? (
            <img
              src={`http://localhost:5000${avatarUrl}?t=${profile?.user?.avatarUploadedAt ? new Date(profile.user.avatarUploadedAt).getTime() : Date.now()}`}
              alt="Avatar"
              className="absolute w-[86px] h-[86px] rounded-full object-cover"
              style={{ top: '19px', left: '19px' }}
            />
          ) : (
            <div 
              className="absolute w-[86px] h-[86px] rounded-full flex items-center justify-center pointer-events-none" 
              style={{ top: '19px', left: '19px' }}
            >
              <span className="font-fraunces text-[29px] font-semibold text-white">
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="self-stretch w-0 border-l-[1.5px] border-dashed border-line-strong max-sm:hidden" />

        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint mb-1">
              Name
            </p>
            <p className="font-serif text-[27px] font-semibold text-ink m-0">
              {profile?.user?.name || 'Crew Member'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-[18px] max-md:grid-cols-2">
            <div>
              <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint mb-1">
                Role
              </p>
              <p className="text-[14px] font-medium text-text m-0">
                {profile?.profile?.role || 'Not Set'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint mb-1">
                Home Port
              </p>
              <p className="text-[14px] font-medium text-text m-0">
                {profile?.profile?.homePort || 'Not Set'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint mb-1">
                Voyage Started
              </p>
              <p className="text-[14px] font-medium text-text m-0">
                {profile?.profile?.currentPeriodStart ? format(new Date(profile.profile.currentPeriodStart), 'MMM yyyy') : 'Loading...'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint mb-1">
                Streak
              </p>
              <p className="text-[14px] font-semibold text-brass-deep m-0">
                ⚓ Day {profile?.profile?.streakDays || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DocumentCard>
  );
}
