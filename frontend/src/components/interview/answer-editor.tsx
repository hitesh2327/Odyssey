'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AnswerEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AnswerEditor({ value, onChange, disabled, className }: AnswerEditorProps) {
  
  const wordCount = useMemo(() => {
    return value.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }, [value]);

  const readingTime = useMemo(() => {
    // Assuming average reading speed of 200 words per minute
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  }, [wordCount]);

  return (
    <div className={cn(
      "relative flex flex-col w-full rounded-xl border border-zinc-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-zinc-900 transition-all duration-200 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 dark:focus-within:ring-zinc-100", 
      className
    )}>
      
      {/* Subtle Answer Tips */}
      <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap gap-4 md:gap-6 text-xs text-zinc-500 font-medium dark:bg-zinc-950/50 dark:border-zinc-800">
        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-500"/> Explain concept</span>
        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500"/> Mention use cases</span>
        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500"/> Give example</span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Start writing your answer here..."
        className="flex-1 w-full h-[calc(100vh-360px)] lg:h-[calc(100vh-320px)] resize-none p-6 text-base leading-relaxed text-zinc-800 placeholder:text-zinc-400 border-0 focus:outline-none focus:ring-0 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />

      {/* Footer strictly for writing metrics */}
      <div className="px-6 py-3 border-t border-zinc-100 flex items-center justify-end bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{readingTime}</span>
        </div>
      </div>
    </div>
  );
}
