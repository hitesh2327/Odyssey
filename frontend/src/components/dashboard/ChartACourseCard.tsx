import React from 'react';
import Link from 'next/link';
import { CompassIcon } from '../ui/icons';

interface ChartACourseCardProps {
  suggestions: { id: string; name: string }[];
}

export function ChartACourseCard({ suggestions }: ChartACourseCardProps) {
  return (
    <div className="bg-card border border-line rounded-[16px] p-[24px_26px] mt-[22px]">
      <p className="font-serif text-[18px] font-semibold text-ink m-0 flex items-center gap-[9px] mb-[6px]">
        <CompassIcon className="text-brass shrink-0" />
        Chart A Course
      </p>
      <p className="text-[13px] text-text-muted m-0 mb-[8px]">Topics ready to explore next.</p>
      
      <div className="flex flex-col">
        {suggestions.map((course, index) => (
          <Link 
            key={course.id} 
            href={`/interview/new?topic=${course.id}`}
            className={`flex items-center justify-between p-[13px_4px] border-b border-dashed border-line cursor-pointer hover:bg-brass-tint hover:rounded-[8px] hover:px-[10px] hover:mx-[-10px] transition-all focus:outline-none focus:ring-2 focus:ring-brass focus:rounded-[8px] ${index === suggestions.length - 1 ? 'border-b-0' : ''}`}
          >
            <div className="flex items-center gap-[11px] text-[14px] font-medium text-ink">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8C641F" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9"/>
              </svg>
              {course.name}
            </div>
            <span className="text-text-faint font-mono">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
