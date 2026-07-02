import React from 'react';
import { ApiProfile } from '../../types/profile';
import { WaypointsIcon, CheckIcon, AnchorIcon, LockIcon } from '../ui/icons';

interface WaypointsCardProps {
  waypoints: ApiProfile['waypoints'];
}

export function WaypointsCard({ waypoints }: WaypointsCardProps) {
  return (
    <div className="bg-card border border-line rounded-[16px] p-[26px_28px] mt-[22px]">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="font-serif text-[19px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          <span className="text-brass"><WaypointsIcon /></span>
          Waypoints
        </h2>
      </div>
      <p className="text-[13.5px] text-text-muted mt-0.5 mb-[18px]">
        Milestones earned along the way.
      </p>

      <div className="grid grid-cols-2 gap-[14px] max-md:grid-cols-1">
        {waypoints.map((waypoint, index) => {
          const unlocked = waypoint.unlocked;
          
          let Icon;
          if (index === 0) Icon = CheckIcon;
          else if (index === 1) Icon = AnchorIcon;
          else Icon = LockIcon;

          return (
            <div
              key={index}
              className={`rounded-[13px] p-4 flex gap-3 items-start ${
                unlocked
                  ? 'bg-brass-tint border border-brass-deep'
                  : 'bg-locked-bg border border-dashed border-locked-border'
              }`}
            >
              <div
                className={`w-[34px] h-[34px] rounded-[9px] shrink-0 flex items-center justify-center ${
                  unlocked ? 'bg-brass text-ink' : 'bg-locked-icon text-text-faint'
                }`}
              >
                <Icon />
              </div>
              <div>
                <p
                  className={`text-[13.5px] font-semibold m-0 mb-[3px] ${
                    unlocked ? 'text-ink' : 'text-text-muted'
                  }`}
                >
                  {waypoint.waypoint.title}
                </p>
                <p className="text-[12px] text-text-muted m-0 leading-[1.4]">
                  {waypoint.waypoint.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
