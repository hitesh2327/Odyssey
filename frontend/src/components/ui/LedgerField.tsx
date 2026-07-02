import * as React from "react";
import { cn } from "../../lib/utils";

interface LedgerFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function LedgerField({ label, children, className }: LedgerFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-text-faint">
        {label}
      </label>
      {children}
    </div>
  );
}

interface LedgerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const LedgerInput = React.forwardRef<HTMLInputElement, LedgerInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "border-none border-b-[1.5px] border-dashed border-line-strong bg-transparent font-sans text-[14.5px] text-text py-1.5 px-0.5 outline-none focus:border-solid focus:border-brass w-full",
          className
        )}
        {...props}
      />
    );
  }
);
LedgerInput.displayName = "LedgerInput";

interface LedgerTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const LedgerTextarea = React.forwardRef<HTMLTextAreaElement, LedgerTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "border-none border-b-[1.5px] border-dashed border-line-strong bg-transparent font-sans text-[14.5px] text-text py-1.5 px-0.5 outline-none focus:border-solid focus:border-brass w-full resize-y min-h-[62px] leading-[1.55]",
          className
        )}
        {...props}
      />
    );
  }
);
LedgerTextarea.displayName = "LedgerTextarea";

interface LedgerSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const LedgerSelect = React.forwardRef<HTMLSelectElement, LedgerSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "appearance-none border-none border-b-[1.5px] border-dashed border-line-strong bg-transparent font-sans text-[14.5px] text-text py-1.5 px-0.5 pr-5 outline-none focus:border-solid focus:border-brass w-full cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-0.5 top-3.5 w-[7px] h-[7px] border-r-[1.5px] border-b-[1.5px] border-text-faint rotate-45 pointer-events-none" />
      </div>
    );
  }
);
LedgerSelect.displayName = "LedgerSelect";
