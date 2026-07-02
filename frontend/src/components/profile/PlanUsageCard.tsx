import React from 'react';
import { Button } from '../ui/button';
import { format, addMonths } from 'date-fns';

interface PlanUsageCardProps {
  planTier: string;
  aiUsesLimit: number;
  aiUsesThisMonth: number;
  currentPeriodStart: string;
}

export function PlanUsageCard({ planTier, aiUsesLimit, aiUsesThisMonth, currentPeriodStart }: PlanUsageCardProps) {
  const usagePercentage = Math.min(100, (aiUsesThisMonth / aiUsesLimit) * 100);
  const resetDate = format(addMonths(new Date(currentPeriodStart), 1), 'MMM d');

  return (
    <div className="bg-card border border-line rounded-[16px] p-[26px_28px] mt-[22px]">
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-serif text-[19px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          Plan & AI Usage
        </p>
      </div>

      <div className="block py-[13px] border-b-0 pb-[6px]">
        <span className="inline-block text-[12px] font-semibold bg-ink text-brass dark:bg-brass-tint dark:text-brass-deep px-[11px] py-1 rounded-[7px] font-mono uppercase">
          {planTier}
        </span>
        <div className="w-full h-[7px] bg-progress rounded-[6px] mt-2.5 overflow-hidden">
          <div
            className="h-full bg-brass rounded-[6px]"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[12px] text-text-muted mt-[7px] font-mono">
          <span>{aiUsesThisMonth} / {aiUsesLimit} AI uses this month</span>
          <span>resets {resetDate}</span>
        </div>
      </div>

      <Button variant="outline" className="w-full mt-4 justify-center">
        Upgrade Plan
      </Button>
    </div>
  );
}
