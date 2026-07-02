'use client';

import React, { useState } from 'react';
import { CompassIcon } from '../ui/icons';
import { ApiProfile } from '../../types/profile';
import { useDashboardPerformance } from '@/hooks/use-dashboard';
import { useProfileModal } from './ProfileModalContext';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';

interface SkillCompassProps {
  topicsOfInterest?: ApiProfile['topicsOfInterest'];
  stats?: ApiProfile['stats'];
}

export function SkillCompass({ topicsOfInterest = [], stats }: SkillCompassProps) {
  const { data: performanceData } = useDashboardPerformance();
  const { openModal } = useProfileModal();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseTopics = [...topicsOfInterest].map(t => t.topic);
  
  const radarTopics = baseTopics.map(topic => {
    const perf = performanceData?.topics.find(t => t.name === topic.name);
    return {
      ...topic,
      score: perf ? perf.averageScore : null,
      attempted: !!perf
    };
  });

  const N = radarTopics.length;
  const angleStep = N > 0 ? (Math.PI * 2) / N : 0;

  // Generate polygon points
  const polygonPoints = radarTopics.map((topic, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = topic.score !== null ? topic.score : 0; // Score = 0 for null
    const x = 170 + r * Math.cos(angle);
    const y = 170 + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const isPolygonVisible = radarTopics.some(t => t.score !== null && t.score > 0);

  const renderCompassSvg = (size = 280) => (
    <svg width={size} height={size} viewBox="-60 -50 460 440" className="overflow-visible select-none">
      {/* grid rings */}
      <circle cx="170" cy="170" r="25" fill="none" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="170" cy="170" r="50" fill="none" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="170" cy="170" r="75" fill="none" stroke="#E4E1D6" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="170" cy="170" r="100" fill="none" stroke="#D8D4C6" strokeWidth="1" />

      {/* axis lines */}
      {radarTopics.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x2 = 170 + 100 * Math.cos(angle);
        const y2 = 170 + 100 * Math.sin(angle);
        return (
          <line key={`axis-${i}`} x1="170" y1="170" x2={x2} y2={y2} stroke="#E4E1D6" strokeWidth="1" />
        );
      })}

      {/* data shape - only render if there are >0 scores */}
      {isPolygonVisible && (
        <polygon 
          points={polygonPoints} 
          fill="#B8863B" fillOpacity="0.22" 
          stroke="#B8863B" strokeWidth="1.6" strokeLinejoin="round" 
        />
      )}
      
      {/* points */}
      {radarTopics.map((topic, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const r = topic.score !== null ? topic.score : 0;
        const x = 170 + r * Math.cos(angle);
        const y = 170 + r * Math.sin(angle);
        return (
          <circle key={`pt-${i}`} cx={x} cy={y} r={topic.score !== null ? 4.5 : 0} fill={topic.score !== null ? "#B8863B" : "transparent"} />
        );
      })}

      {/* labels */}
      {radarTopics.map((topic, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        
        // Dynamically adjust label radius based on N to spread out labels
        const labelRadius = N > 15 ? 142 : (N > 10 ? 138 : 135);
        const x = 170 + labelRadius * Math.cos(angle);
        let y = 170 + labelRadius * Math.sin(angle);
        
        let textAnchor: 'middle' | 'start' | 'end' = 'middle';
        if (Math.cos(angle) > 0.1) textAnchor = 'start';
        else if (Math.cos(angle) < -0.1) textAnchor = 'end';
        
        // Adjust vertical alignment slightly based on position
        if (Math.sin(angle) > 0.5) y += 8;
        if (Math.sin(angle) < -0.5) y -= 8;

        // Dynamic font size based on number of topics (N) to prevent overlap
        const fontSize = N > 15 ? "10" : (N > 10 ? "11.5" : "13");

        return (
          <g key={`label-${i}`}>
            <text x={x} y={y} textAnchor={textAnchor} fontFamily="var(--font-inter)" fontSize={fontSize} fontWeight="600" fill="#1C2240">
              {topic.name.length > 20 ? topic.name.substring(0, 18) + '..' : topic.name}
            </text>
            {topic.score !== null && (
              <text x={x} y={y + 13} textAnchor={textAnchor} fontFamily="var(--font-ibm-plex-mono)" fontSize={N > 15 ? "9.5" : "11"} fill="#B8863B">
                {`${topic.score}%`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );

  const renderLegend = (maxHeight = '250px') => (
    <div className="flex-1 flex flex-col gap-[11px] overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight }}>
      {topicsOfInterest.map(t => {
        const perf = performanceData?.topics.find(p => p.name === t.topic.name);
        const score = perf ? perf.averageScore : null;
        return (
          <div key={t.topic.id} className="flex items-center justify-between text-[13.5px]">
            <div className="flex items-center gap-[9px]">
              <div className={`w-2 h-2 rounded-full ${score !== null ? 'bg-brass' : 'bg-[#C9C5B6]'}`} /> 
              <span className={score === null ? 'text-text-muted' : 'text-ink'}>{t.topic.name}</span>
            </div>
            <span className={`font-mono text-[12.5px] font-semibold ${score !== null ? 'text-brass-deep' : 'text-text-muted'}`}>
              {score !== null ? `${score}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card border border-line rounded-[16px] p-[26px_28px]">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="font-serif text-[19px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          <span 
            className="text-brass cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setIsModalOpen(true)}
            title="Expand Skill Compass"
          >
            <CompassIcon />
          </span>
          Skill Compass
        </h2>
      </div>
      <p className="text-[13.5px] text-text-muted mt-0.5 mb-[18px]">
        Your mastery across topics. Most of the map is still unexplored — take more assessments to chart it.
      </p>

      {topicsOfInterest.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 w-full">
          <div className="text-text-faint mb-[14px]">
            <CompassIcon width="42" height="42" />
          </div>
          <h3 className="font-serif text-[18px] font-semibold text-ink m-0 mb-1.5">
            No topics charted yet
          </h3>
          <p className="text-[13.5px] text-text-muted m-0 mb-[22px] max-w-[280px]">
            Add topics of interest in your profile to start mapping your skills.
          </p>
          <Button variant="outline" onClick={openModal}>
            Add Topics
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-[18px] max-sm:flex-col">
          <div 
            className="cursor-pointer hover:opacity-95 transition-opacity" 
            onClick={() => setIsModalOpen(true)}
            title="Click to view larger"
          >
            {renderCompassSvg(280)}
          </div>
          {renderLegend('250px')}
        </div>
      )}

      {/* Large sized Modal (max-w-4xl) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Skill Compass"
        className="max-w-6xl"
      >
        <div className="flex items-center gap-[40px] max-sm:flex-col justify-center p-4">
          <div className="shrink-0">
            {renderCompassSvg(600)}
          </div>
          {renderLegend('400px')}
        </div>
      </Modal>
    </div>
  );
}
