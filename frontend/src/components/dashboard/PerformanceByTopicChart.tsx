import React from 'react';

interface TopicPerformance {
  name: string;
  averageScore: number;
  assessmentsCount: number;
}

interface PerformanceByTopicChartProps {
  topics?: TopicPerformance[];
}

export function PerformanceByTopicChart({ topics = [] }: PerformanceByTopicChartProps) {
  // If no topics, show empty state or fallback to a single placeholder
  const displayTopics = topics.length > 0 ? topics : [];

  return (
    <div className="bg-card border border-line rounded-[16px] p-[24px_26px] mt-[22px]">
      <div className="mb-[18px]">
        <p className="font-serif text-[18px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8863B" strokeWidth="1.8">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 16v-4M12 16V8M16 16v-7" />
          </svg>
          Performance By Topic
        </p>
        <p className="text-[13px] text-text-muted m-0 mt-[3px]">How you've scored, topic by topic.</p>
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
        
        {displayTopics.length === 0 ? (
          <text x="325" y="130" textAnchor="middle" className="font-mono text-[12px] fill-text-faint">No performance data yet</text>
        ) : (
          displayTopics.map((topic, index) => {
            const spacing = 550 / (displayTopics.length + 1);
            const xPos = 50 + spacing * (index + 1);
            const barHeight = (topic.averageScore / 100) * 240;
            const yPos = 250 - barHeight;

            return (
              <g key={topic.name}>
                <rect x={xPos - 35} y={yPos} width="70" height={barHeight} rx="4" fill="#B8863B" />
                <text x={xPos} y={yPos - 10} textAnchor="middle" className="font-mono text-[12px] font-semibold fill-brass-deep">
                  {topic.averageScore}%
                </text>
                <text x={xPos} y="272" textAnchor="middle" className="font-mono text-[11px] fill-text-faint">
                  {topic.name.length > 10 ? `${topic.name.substring(0, 10)}...` : topic.name}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
