import * as React from "react";
import { cn } from "../../lib/utils";

interface DocumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DocumentCard({ className, children, ...props }: DocumentCardProps) {
  return (
    <div
      className={cn(
        "relative bg-passport border border-line-strong rounded-[14px]",
        className
      )}
      {...props}
    >
      <div className="absolute w-[13px] h-[13px] border-brass border-t-2 border-l-2 rounded-tl-[14px] -top-px -left-px" />
      <div className="absolute w-[13px] h-[13px] border-brass border-t-2 border-r-2 rounded-tr-[14px] -top-px -right-px" />
      <div className="absolute w-[13px] h-[13px] border-brass border-b-2 border-l-2 rounded-bl-[14px] -bottom-px -left-px" />
      <div className="absolute w-[13px] h-[13px] border-brass border-b-2 border-r-2 rounded-br-[14px] -bottom-px -right-px" />
      {children}
    </div>
  );
}
