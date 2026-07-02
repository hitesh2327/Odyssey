import React from 'react';

interface PageHeaderProps {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  cta?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, cta }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-7">
      <div>
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-brass-deep m-0 mb-2">
          {eyebrow}
        </p>
        <p className="font-serif text-[30px] font-semibold text-ink m-0">
          {title}
        </p>
        {subtitle && (
          <p className="text-[14px] text-text-muted m-0 mt-2 max-w-[480px] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {cta && <div>{cta}</div>}
    </div>
  );
}
