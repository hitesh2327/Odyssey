import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SessionProgress } from '@/services/sessions.service';
import { Drawer } from '@/components/ui/drawer';
import { Menu, CheckCircle2, Circle } from 'lucide-react';

interface InterviewLayoutProps {
  children: React.ReactNode;
  progress?: SessionProgress;
  onNavigate?: (order: number) => void;
  isSaving?: boolean;
}

export function InterviewLayout({ children, progress, onNavigate, isSaving }: InterviewLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const currentQ = progress?.currentQuestion || 1;
  const totalQ = progress?.total || 5;

  const handleNavigate = (order: number) => {
    onNavigate?.(order);
    setIsMobileMenuOpen(false);
  };

  const renderNavItems = () => (
    <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
      {Array.from({ length: totalQ }).map((_, idx) => {
        const order = idx + 1;
        const isCurrent = order === currentQ;
        const isAnswered = order <= (progress?.answered || 0);
        const isDisabled = !isAnswered && order > (progress?.answered || 0) + 1;
        
        return (
          <button
            key={order}
            onClick={() => handleNavigate(order)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border",
              isCurrent 
                ? "bg-zinc-100 border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 shadow-sm"
                : isAnswered
                  ? "bg-transparent border-transparent text-zinc-600 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  : "bg-transparent border-transparent text-zinc-400 cursor-not-allowed dark:text-zinc-600"
            )}
            disabled={isDisabled}
          >
            {isAnswered && !isCurrent ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : isCurrent ? (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            ) : (
              <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />
            )}
            <span>Question {order}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hidden lg:flex flex-col shadow-sm z-10">
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Overall Progress</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
              <div 
                className="absolute inset-y-0 left-0 bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out"
                style={{ width: `${((progress?.answered || 0) / totalQ) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {progress?.answered || 0}/{totalQ}
            </span>
          </div>
        </div>
        
        {renderNavItems()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header for Sidebar Toggle */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 shrink-0">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Odyssey Assessment</h1>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {children}
      </main>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Assessment Progress"
        position="left"
      >
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out"
                  style={{ width: `${((progress?.answered || 0) / totalQ) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {progress?.answered || 0}/{totalQ}
              </span>
            </div>
          </div>
          {renderNavItems()}
        </div>
      </Drawer>
    </div>
  );
}
