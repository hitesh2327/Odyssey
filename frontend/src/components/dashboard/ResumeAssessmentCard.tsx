import React from 'react';
import Link from 'next/link';

interface ResumeAssessmentCardProps {
  assessment: {
    topic: string;
    level: string;
    completedModules: number;
    totalModules: number;
    sessionId?: string;
  };
}

export function ResumeAssessmentCard({ assessment }: ResumeAssessmentCardProps) {
  const dots = Array.from({ length: assessment.totalModules });
  
  return (
    <div className="bg-card border border-dashed border-line-strong rounded-[16px] p-[24px_26px] relative">
      <span className="absolute top-[16px] right-[16px] font-mono text-[10px] tracking-[0.08em] uppercase bg-brass-tint text-brass-deep p-[4px_9px] rounded-[5px] transform rotate-[2deg]">
        {assessment.completedModules} / {assessment.totalModules} Modules
      </span>
      
      <p className="font-serif text-[18px] font-semibold text-ink m-0 flex items-center gap-[9px] mb-[16px]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8863B" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 3"/>
        </svg>
        Resume Assessment
      </p>
      
      <p className="font-serif text-[19px] font-semibold text-ink m-0 mb-[4px]">{assessment.topic}</p>
      <p className="font-mono text-[11.5px] text-text-muted m-0 mb-[14px] uppercase">{assessment.level} · IN PROGRESS</p>
      
      <div className="flex gap-[6px] mb-[18px]">
        {dots.map((_, i) => (
          <div 
            key={i} 
            className={`w-[9px] h-[9px] rounded-[2px] ${i < assessment.completedModules ? 'bg-brass' : 'bg-[#EAE6D8]'}`} 
          />
        ))}
      </div>
      
      <Link 
        href={`/interview/${assessment.sessionId || 'mock'}`} 
        className="flex items-center gap-[10px] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brass rounded p-[2px]"
      >
        <div className="w-[32px] h-[32px] rounded-full bg-ink flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E4C895">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span className="text-[13.5px] font-semibold text-harbor group-hover:text-ink transition-colors">Continue where you left off</span>
      </Link>
    </div>
  );
}
