'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

interface AskAIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  questionId?: string;
}

export function AskAIDrawer({ isOpen, onClose, questionId }: AskAIDrawerProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = () => {
    if (!questionId) return;
    
    // Reset state
    setStreamContent('');
    setError(null);
    setIsStreaming(true);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Connect to SSE endpoint
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/questions/${questionId}/assist/stream`;
    
    // Create EventSource with credentials for cookies
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          setIsStreaming(false);
          es.close();
        } else if (data.text) {
          setStreamContent((prev) => prev + data.text);
        }
      } catch (err) {
        console.error('Error parsing SSE message', err);
      }
    };

    es.addEventListener('end', () => {
      setIsStreaming(false);
      es.close();
    });

    es.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Stream disconnected unexpectedly.');
      setIsStreaming(false);
      es.close();
    };
  };

  // Reset state when questionId changes to prevent showing previous question's AI data
  useEffect(() => {
    setStreamContent('');
    setError(null);
    setIsStreaming(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, [questionId]);

  useEffect(() => {
    if (isOpen && questionId && !streamContent && !isStreaming && !error) {
      startStream();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, questionId, streamContent, isStreaming, error]);

  useEffect(() => {
    // Cleanup on unmount or close
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="AI Assistant" className="bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col h-full">
        {isStreaming && !streamContent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium animate-pulse">AI is generating guidance...</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Failed to get AI assistance</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={startStream} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry Request
            </Button>
          </div>
        )}

        {(streamContent || (isStreaming && streamContent)) && (
          <div className="space-y-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Lightbulb className="h-5 w-5" />
                <h3 className="text-base font-semibold">AI Assistant Guidance</h3>
                {isStreaming && (
                  <span className="flex space-x-1 items-center ml-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  </span>
                )}
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => {
                      return (
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0 flex items-center gap-2">
                          {props.children}
                        </h3>
                      );
                    },
                    p: ({node, ...props}) => (
                      <p className="mb-4 last:mb-0 text-sm leading-relaxed text-gray-700 dark:text-gray-300" {...props} />
                    ),
                    hr: () => (
                      <hr className="my-6 border-t border-gray-200 dark:border-gray-800" />
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="mb-4 space-y-2" {...props} />
                    ),
                    li: ({node, ...props}) => (
                      <li className="text-sm text-gray-700 dark:text-gray-300" {...props} />
                    ),
                    code: ({node, className, children, ...props}: any) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[13px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30 mx-0.5">
                            {children}
                          </span>
                        );
                      }
                      return <code className={className} {...props}>{children}</code>;
                    }
                  }}
                >
                  {streamContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
