import React from 'react';
import { TotalSessionsIcon, CompletedIcon, AvgScoreIcon, AiUsesIcon } from './icons';

interface InstrumentPanelProps {
  stats: {
    totalSessions: number;
    completed: number;
    avgScore: number;
    aiUses: number;
  };
}

export function InstrumentPanel({ stats }: InstrumentPanelProps) {
  return (
    <div className="flex flex-wrap lg:flex-nowrap bg-card border border-line rounded-[14px] mb-[24px]">
      <div className="flex-1 basis-[50%] lg:basis-0 flex items-center gap-[13px] p-[18px_22px] relative after:content-[''] after:absolute after:right-0 after:top-[16%] after:bottom-[16%] after:border-r after:border-dashed after:border-line-strong">
        <div className="w-[36px] h-[36px] rounded-[9px] shrink-0 flex items-center justify-center bg-harbor-tint text-harbor">
          <TotalSessionsIcon />
        </div>
        <div>
          <p className="text-[12px] text-text-muted m-0 mb-[2px]">Total Sessions</p>
          <p className="font-mono text-[20px] font-semibold text-ink m-0">{stats.totalSessions}</p>
        </div>
      </div>

      <div className="flex-1 basis-[50%] lg:basis-0 flex items-center gap-[13px] p-[18px_22px] relative lg:after:content-[''] lg:after:absolute lg:after:right-0 lg:after:top-[16%] lg:after:bottom-[16%] lg:after:border-r lg:after:border-dashed lg:after:border-line-strong">
        <div className="w-[36px] h-[36px] rounded-[9px] shrink-0 flex items-center justify-center bg-sea-tint text-sea">
          <CompletedIcon />
        </div>
        <div>
          <p className="text-[12px] text-text-muted m-0 mb-[2px]">Completed</p>
          <p className="font-mono text-[20px] font-semibold text-ink m-0">{stats.completed}</p>
        </div>
      </div>

      <div className="flex-1 basis-[50%] lg:basis-0 flex items-center gap-[13px] p-[18px_22px] relative after:content-[''] after:absolute after:right-0 after:top-[16%] after:bottom-[16%] after:border-r after:border-dashed after:border-line-strong">
        <div className="w-[36px] h-[36px] rounded-[9px] shrink-0 flex items-center justify-center bg-brass-tint text-brass-deep">
          <AvgScoreIcon />
        </div>
        <div>
          <p className="text-[12px] text-text-muted m-0 mb-[2px]">Avg. Score</p>
          <p className="font-mono text-[20px] font-semibold text-ink m-0">{stats.avgScore}</p>
        </div>
      </div>

      <div className="flex-1 basis-[50%] lg:basis-0 flex items-center gap-[13px] p-[18px_22px]">
        <div className="w-[36px] h-[36px] rounded-[9px] shrink-0 flex items-center justify-center bg-coral-tint text-coral">
          <AiUsesIcon />
        </div>
        <div>
          <p className="text-[12px] text-text-muted m-0 mb-[2px]">AI Uses</p>
          <p className="font-mono text-[20px] font-semibold text-ink m-0">{stats.aiUses}</p>
        </div>
      </div>
    </div>
  );
}
