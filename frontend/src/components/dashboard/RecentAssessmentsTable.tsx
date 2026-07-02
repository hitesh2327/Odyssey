import React from 'react';
import Link from 'next/link';
import { Pill } from '../ui/Pill';

interface Assessment {
  topic: string;
  level: string;
  status: 'completed' | 'in_progress';
  score: number | null;
  sessionId?: string; // Optional, to link to the actual session
}

interface RecentAssessmentsTableProps {
  assessments: Assessment[];
}

export function RecentAssessmentsTable({ assessments }: RecentAssessmentsTableProps) {
  return (
    <div className="bg-card border border-line rounded-[16px] p-[24px_26px] mt-[22px]">
      <div className="mb-[6px]">
        <p className="font-serif text-[18px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8863B" strokeWidth="1.8">
            <path d="M4 21V5a1 1 0 011-1h13l-3 5 3 5H6" />
          </svg>
          Recent Assessments
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mt-[6px] min-w-[500px]">
          <thead>
            <tr>
              <th className="text-left font-mono text-[10.5px] tracking-[0.08em] uppercase text-text-faint font-medium p-[0_4px_12px] border-b border-line-strong">Topic</th>
              <th className="text-left font-mono text-[10.5px] tracking-[0.08em] uppercase text-text-faint font-medium p-[0_4px_12px] border-b border-line-strong">Status</th>
              <th className="text-left font-mono text-[10.5px] tracking-[0.08em] uppercase text-text-faint font-medium p-[0_4px_12px] border-b border-line-strong">Score</th>
              <th className="text-left font-mono text-[10.5px] tracking-[0.08em] uppercase text-text-faint font-medium p-[0_4px_12px] border-b border-line-strong">Action</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment, index) => {
              const isLast = index === assessments.length - 1;
              const linkTarget = assessment.status === 'completed' 
                ? `/summary/${assessment.sessionId || 'mock'}`
                : `/interview/${assessment.sessionId || 'mock'}`;
                
              return (
                <tr key={index}>
                  <td className={`p-[16px_4px] text-[14px] ${!isLast ? 'border-b border-dashed border-line' : ''}`}>
                    <div className="font-semibold text-ink">{assessment.topic}</div>
                    <div className="font-mono text-[11px] text-text-faint mt-[2px] uppercase">{assessment.level}</div>
                  </td>
                  <td className={`p-[16px_4px] text-[14px] ${!isLast ? 'border-b border-dashed border-line' : ''}`}>
                    <Pill variant={assessment.status}>
                      {assessment.status === 'completed' ? '✓ Completed' : '◷ In Progress'}
                    </Pill>
                  </td>
                  <td className={`p-[16px_4px] text-[14px] ${!isLast ? 'border-b border-dashed border-line' : ''}`}>
                    <span className={`font-mono font-semibold ${assessment.score !== null ? 'text-ink' : 'text-text-faint'}`}>
                      {assessment.score !== null ? `${assessment.score}%` : '—'}
                    </span>
                  </td>
                  <td className={`p-[16px_4px] text-[14px] ${!isLast ? 'border-b border-dashed border-line' : ''}`}>
                    <Link href={linkTarget} className="font-semibold text-harbor inline-flex items-center gap-[5px] hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brass rounded">
                      {assessment.status === 'completed' ? 'View Result →' : '⚓ Resume'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
