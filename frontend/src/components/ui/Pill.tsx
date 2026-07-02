import React from 'react';

type PillVariant = 'completed' | 'in_progress';

interface PillProps {
  variant: PillVariant;
  children: React.ReactNode;
}

export function Pill({ variant, children }: PillProps) {
  const baseStyles = "inline-flex items-center gap-[6px] text-[12.5px] font-semibold p-[5px_11px] rounded-[20px]";
  
  const variants = {
    completed: "bg-sea-tint text-sea",
    in_progress: "bg-brass-tint text-brass-deep"
  };

  return (
    <span className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </span>
  );
}
