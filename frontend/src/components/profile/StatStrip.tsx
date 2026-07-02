import React from 'react';
import { UserProfile } from '../../types/profile';
import { TotalSessionsIcon, CompletedIcon, AvgScoreIcon, AiUsesIcon } from '../ui/icons';

interface StatStripProps {
  stats: UserProfile['stats'];
}

export function StatStrip({ stats }: StatStripProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mt-[22px] max-md:grid-cols-2 max-sm:grid-cols-2">
      <div className="bg-card border border-line rounded-[14px] px-5 py-[18px] flex items-center gap-[14px]">
        <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center bg-stat-sessions text-harbor">
          <TotalSessionsIcon />
        </div>
        <div>
          <p className="text-[12.5px] text-text-muted mb-0.5">Total Sessions</p>
          <p className="font-mono text-[22px] font-semibold text-ink m-0">{stats.totalSessions}</p>
        </div>
      </div>
      
      <div className="bg-card border border-line rounded-[14px] px-5 py-[18px] flex items-center gap-[14px]">
        <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center bg-sea-tint text-sea">
          <CompletedIcon />
        </div>
        <div>
          <p className="text-[12.5px] text-text-muted mb-0.5">Completed</p>
          <p className="font-mono text-[22px] font-semibold text-ink m-0">{stats.completed}</p>
        </div>
      </div>
      
      <div className="bg-card border border-line rounded-[14px] px-5 py-[18px] flex items-center gap-[14px]">
        <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center bg-brass-tint text-brass-deep">
          <AvgScoreIcon />
        </div>
        <div>
          <p className="text-[12.5px] text-text-muted mb-0.5">Avg. Score</p>
          <p className="font-mono text-[22px] font-semibold text-ink m-0">{stats.avgScore}</p>
        </div>
      </div>
      
      <div className="bg-card border border-line rounded-[14px] px-5 py-[18px] flex items-center gap-[14px]">
        <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center bg-coral-tint text-coral">
          <AiUsesIcon />
        </div>
        <div>
          <p className="text-[12.5px] text-text-muted mb-0.5">AI Uses</p>
          <p className="font-mono text-[22px] font-semibold text-ink m-0">{stats.aiUses}</p>
        </div>
      </div>
    </div>
  );
}
