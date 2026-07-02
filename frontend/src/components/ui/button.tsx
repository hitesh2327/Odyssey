import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brass' | 'stamp';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 rounded-lg',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 rounded-lg',
      outline: 'border border-line-strong bg-transparent text-text hover:border-ink focus:ring-ink rounded-[9px]',
      ghost: 'bg-transparent text-harbor text-[13.5px] font-semibold hover:text-ink focus:ring-0',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 rounded-lg',
      brass: 'bg-brass text-ink hover:bg-[#c79644] focus:ring-brass rounded-[9px] font-sans font-semibold',
      stamp: 'bg-transparent text-brass-deep border border-dashed border-brass rounded-md font-mono text-[11.5px] tracking-[0.05em] uppercase hover:bg-brass-tint -rotate-[1.4deg] origin-center focus:ring-brass',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 py-3 text-base',
      icon: 'h-10 w-10',
      default: 'px-[20px] py-[11px] text-[14px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
