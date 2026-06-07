'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { useSessionProgress, useCompleteSession } from '@/hooks/use-sessions';
import { useQuestion } from '@/hooks/use-questions';
import { useSaveAnswer } from '@/hooks/use-answers';
import { InterviewLayout } from '@/components/interview/interview-layout';
import { AnswerEditor } from '@/components/interview/answer-editor';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

import { AskAIDrawer } from '@/components/ai-assistance/ask-ai-drawer';

function getDifficultyBadgeStyles(difficulty?: string) {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    case 'intermediate':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'advanced':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
  }
}

export default function InterviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q');
  
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [localAnswer, setLocalAnswer] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 mins realistic mock timer

  // Parse order, default to 1
  const order = parseInt(qParam || '1', 10);
  
  if (isNaN(order) || order < 1 || order > 5) {
    router.replace(`/interview/${sessionId}?q=1`);
  }

  const { data: progress, isLoading: isProgressLoading, isError: isProgressError } = useSessionProgress(sessionId);
  const { data: question, isLoading: isQuestionLoading } = useQuestion(sessionId, order);
  const { mutateAsync: saveAnswer, isPending: isSaving } = useSaveAnswer();
  const { mutateAsync: completeSession, isPending: isCompleting } = useCompleteSession();

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (isProgressError) {
      toast.error('Session not found or expired.');
      router.replace('/dashboard');
    }
  }, [isProgressError, router]);

  useEffect(() => {
    if (question) {
      setLocalAnswer(question.existingAnswer || '');
      setHasUnsavedChanges(false);
    }
  }, [question]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleLocalChange = (val: string) => {
    setLocalAnswer(val);
    if (question && val !== (question.existingAnswer || '')) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  };

  const handleSave = async (silent = false) => {
    if (!question || !hasUnsavedChanges) return true;
    
    try {
      await saveAnswer({
        sessionId,
        questionId: question.id,
        answerText: localAnswer
      });
      setHasUnsavedChanges(false);
      if (!silent) toast.success('Draft saved successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to save answer. Draft stored locally.');
      return false;
    }
  };

  const navigateTo = async (newOrder: number) => {
    if (newOrder <= order) {
      const saved = await handleSave(true);
      if (saved) {
        router.push(`/interview/${sessionId}?q=${newOrder}`);
      }
      return;
    }

    const hasCurrentAnswer = !!localAnswer.trim();
    const answeredCount = progress?.answered || 0;
    const effectiveAnswered = hasCurrentAnswer ? Math.max(answeredCount, order) : answeredCount;
    const allowedMax = effectiveAnswered + 1;

    if (newOrder > allowedMax) {
      toast.error('Please answer current questions first.');
      return;
    }
    
    const saved = await handleSave(true);
    if (saved) {
      router.push(`/interview/${sessionId}?q=${newOrder}`);
    }
  };

  const handleComplete = async () => {
    const saved = await handleSave(true);
    if (saved) {
      try {
        await completeSession(sessionId);
        toast.success('Assessment completed!');
        router.push(`/summary/${sessionId}`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to complete session');
      }
    }
  };

  const total = progress?.total || 5;
  const isLastQuestion = order === total;

  if (isProgressLoading) {
    return <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin dark:border-zinc-100"></div>
    </div>;
  }

  return (
    <InterviewLayout 
      progress={progress} 
      onNavigate={(newOrder) => navigateTo(newOrder)}
      isSaving={isSaving}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl space-y-6 h-full flex flex-col">
          
          {/* Top Header: Timer and Actions */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <h1 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest dark:text-zinc-400 hidden sm:block">
              Question {order} of {total}
            </h1>
            
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2 text-zinc-600 font-medium px-4 py-2 bg-white rounded-full border border-zinc-200 shadow-sm text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300">
                <Timer className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span className="tabular-nums">{formatTime(timeLeft)} remaining</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSave(false)}
                disabled={!hasUnsavedChanges || isSaving}
                className="hidden sm:flex bg-white dark:bg-zinc-900 hover:bg-zinc-100 shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button 
                size="sm"
                onClick={() => setIsAiDrawerOpen(true)}
                className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-all active:scale-95 gap-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </Button>
            </div>
          </header>

          {/* Question Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
            {isQuestionLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-full mt-4" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 shadow-none dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border-none">
                    {progress?.topic?.name || 'Topic'}
                  </Badge>
                  <Badge className={getDifficultyBadgeStyles(question?.difficulty)}>
                    {question?.difficulty || 'Standard'}
                  </Badge>
                </div>
                <h2 className="text-xl font-semibold leading-relaxed text-zinc-900 tracking-tight dark:text-zinc-100">
                  {question?.questionText}
                </h2>
              </>
            )}
          </div>

          {/* Answer Editor Workspace */}
          <div className="flex-1 flex flex-col">
            {isQuestionLoading ? (
              <Skeleton className="h-[400px] w-full rounded-xl" />
            ) : (
              <AnswerEditor 
                value={localAnswer} 
                onChange={handleLocalChange}
                disabled={isSaving}
              />
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-2 shrink-0">
            <Button
              variant="ghost"
              onClick={() => navigateTo(order - 1)}
              disabled={order === 1 || isSaving}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                size="lg"
                onClick={handleComplete}
                disabled={isSaving || isCompleting || !localAnswer.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all active:scale-95"
              >
                Complete Assessment
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigateTo(order + 1)}
                disabled={isSaving || !localAnswer.trim()}
                className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md transition-all active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Next Question
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AskAIDrawer 
        isOpen={isAiDrawerOpen} 
        onClose={() => setIsAiDrawerOpen(false)} 
        questionId={question?.id}
      />
    </InterviewLayout>
  );
}
