import * as React from "react";
import { cn } from "../../lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "font-sans text-[12.5px] px-[14px] py-[7px] rounded-[20px] border inline-flex items-center gap-[7px] transition-colors focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1",
          selected
            ? "bg-brass-tint border-brass text-brass-deep font-semibold"
            : "bg-chip border-line-strong text-text-muted font-medium hover:bg-chip-hover",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            selected ? "bg-brass" : "bg-text-faint"
          )}
        />
        {children}
      </button>
    );
  }
);
Chip.displayName = "Chip";
