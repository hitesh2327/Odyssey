import React from 'react';
import { CompassIcon } from '../ui/icons';
import { format } from 'date-fns';

interface TrendItem {
  sessionId: string;
  score: number;
  topic: string;
  date: string;
}

interface PerformanceTrendChartProps {
  trend?: TrendItem[];
}

export function PerformanceTrendChart({ trend = [] }: PerformanceTrendChartProps) {
  // SVG coordinates:
  // X: 50 to 600 (width 550)
  // Y: 10 to 250 (height 240, where 10 = 100% and 250 = 0%)

  const points = trend.map((item, index) => {
    const spacing = 550 / (trend.length > 1 ? trend.length - 1 : 1);
    const x = trend.length === 1 ? 325 : 50 + spacing * index;
    const y = 250 - (item.score / 100) * 240;
    return { x, y, item };
  });

  // Create SVG path data
  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <div className="bg-card border border-line rounded-[16px] p-[24px_26px] mt-[22px]">
      <div className="mb-[18px]">
        <p className="font-serif text-[18px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          <CompassIcon className="text-brass shrink-0" />
          Recent Performance Trend
        </p>
        <p className="text-[13px] text-text-muted m-0 mt-[3px]">Score over your last sessions.</p>
      </div>
      <svg width="100%" height="230" viewBox="0 0 620 280">
        <line x1="50" y1="10" x2="600" y2="10" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="50" y1="70" x2="600" y2="70" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="50" y1="130" x2="600" y2="130" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="50" y1="190" x2="600" y2="190" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="50" y1="250" x2="600" y2="250" stroke="#D8D4C6" strokeWidth="1" />
        <text x="40" y="14" textAnchor="end" className="font-mono text-[11px] fill-text-faint">100</text>
        <text x="40" y="74" textAnchor="end" className="font-mono text-[11px] fill-text-faint">75</text>
        <text x="40" y="134" textAnchor="end" className="font-mono text-[11px] fill-text-faint">50</text>
        <text x="40" y="194" textAnchor="end" className="font-mono text-[11px] fill-text-faint">25</text>
        <text x="40" y="254" textAnchor="end" className="font-mono text-[11px] fill-text-faint">0</text>

        {points.length === 0 ? (
          <text x="325" y="130" textAnchor="middle" className="font-mono text-[12px] fill-text-faint">No trend data yet</text>
        ) : (
          <>
            {points.length > 1 && (
              <path d={pathD} fill="none" stroke="#B8863B" strokeWidth="2.5" />
            )}
            {points.map((p, i) => (
              <g key={p.item.sessionId}>
                <text x={p.x} y="272" textAnchor="middle" className="font-mono text-[11px] fill-text-faint">
                  {format(new Date(p.item.date), 'MMM d')}
                </text>
                <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#B8863B" strokeWidth="2.5" />
                {/* Score text above point */}
                <text x={p.x} y={p.y - 12} textAnchor="middle" className="font-mono text-[10px] font-semibold fill-brass-deep">
                  {p.item.score}%
                </text>
              </g>
            ))}
          </>
        )}
      </svg>
      {points.length < 3 && (
        <p className="text-[12.5px] text-text-faint italic m-0 mt-[10px] pl-[2px]">Complete a few more sessions to start charting your trend.</p>
      )}
    </div>
  );
}
