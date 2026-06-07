'use client';

import { useLoaderStore } from '@/store/loader.store';
import { useEffect, useState } from 'react';

export function GlobalLoader() {
  const { isLoading } = useLoaderStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(10);
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 300);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 400); // Hide after transition
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
