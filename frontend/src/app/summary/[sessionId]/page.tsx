'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionSummary } from '@/hooks/use-sessions';
import { useEvaluationStatus } from '@/hooks/use-evaluation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Sparkles, BrainCircuit, ChevronRight, Activity, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SummaryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data: summary, isLoading: isSummaryLoading, isFetching: isSummaryFetching, isError } = useSessionSummary(sessionId);

  // Poll evaluation status if it's pending or processing
  const { data: pollStatus } = useEvaluationStatus(sessionId, {
    enabled: !!summary && (summary.evaluationStatus === 'PENDING' || summary.evaluationStatus === 'PROCESSING')
  });

  React.useEffect(() => {
    if (pollStatus && pollStatus !== 'PENDING' && pollStatus !== 'PROCESSING') {
      // Evaluation is done. Refetch the summary to get the actual results.
      queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'summary'] });
    }
  }, [pollStatus, sessionId, queryClient]);

  const [expandedQs, setExpandedQs] = useState<Record<string, boolean>>({});

  const toggleQ = (id: string) => {
    setExpandedQs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isGenerating = summary?.evaluationStatus === 'PENDING' || summary?.evaluationStatus === 'PROCESSING';
  const isLoading = isSummaryLoading || isGenerating;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generating your interview report...</h2>
            <p className="text-gray-500 dark:text-gray-400">Our AI is analyzing your answers and computing your final score.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Summary not found or failed</h2>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { statistics, topic, difficulty, questions, overallScore, overallFeedback, performanceLevel, evaluationStatus } = summary;

  const badgeColors: Record<string, string> = {
    'Excellent': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200',
    'Strong': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200',
    'Good': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200',
    'Average': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200',
    'Needs Improvement': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200',
    'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-200',
  };

  const badgeColor = badgeColors[performanceLevel || ''] || 'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <Navbar />
      
      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessment Result</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {topic} ({difficulty.toLowerCase()}) • {new Date(summary.completedAt || '').toLocaleDateString()}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              Return to Dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Score Section */}
        <div className="bg-white dark:bg-gray-950 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900 border-[12px] border-indigo-50 dark:border-indigo-900/20">
              {evaluationStatus === 'COMPLETED' ? (
                <div className="text-center">
                  <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                    {overallScore}
                  </span>
                  <span className="text-xl text-gray-400 block mt-1">/100</span>
                </div>
              ) : (
                <div className="text-red-500 font-bold">Failed</div>
              )}
            </div>
            <div className={`mt-6 px-4 py-1.5 rounded-full border ${badgeColor} text-sm font-bold tracking-wide uppercase`}>
              {performanceLevel}
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overall Feedback</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl">
              {overallFeedback || "No feedback generated."}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4" /> {statistics.durationInMinutes} mins
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-500" /> AI Used {statistics.aiAssistUsed} times
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Question Review</h2>
          <div className="space-y-4">
            {questions.map((q) => {
              const isExpanded = !!expandedQs[q.questionId];
              return (
                <Card key={q.questionId} className="overflow-hidden transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800">
                  <div 
                    onClick={() => toggleQ(q.questionId)}
                    className="cursor-pointer border-b border-transparent hover:bg-gray-50/50 px-6 py-5 dark:hover:bg-gray-900/30 flex justify-between items-center transition-colors"
                  >
                    <div className="flex-1 pr-6 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold text-sm">
                          {q.questionOrder}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-2 md:line-clamp-none">
                          {q.questionText}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-11">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Score: {q.score !== null ? `${q.score}/100` : '-'}
                        </span>
                        {q.usedAI && (
                          <span className="flex items-center space-x-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                            <Sparkles className="h-3 w-3" /> AI Used
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <CardContent className="p-0 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/20">
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
                        {/* User Answer */}
                        <div className="p-6 space-y-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            Your Answer
                          </h4>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            {q.answer || <span className="italic text-gray-400">No answer provided.</span>}
                          </div>
                        </div>

                        {/* AI Evaluation */}
                        <div className="p-6 space-y-6">
                          
                          {/* Breakdown Scores */}
                          {q.breakdown && Object.keys(q.breakdown).length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">Evaluation Breakdown</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(q.breakdown).map(([key, value]) => {
                                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                  const score = Number(value);
                                  return (
                                    <div key={key} className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                                      <span className="font-semibold text-gray-900 dark:text-white">{score}/20</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Feedback */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                              <BrainCircuit className="w-4 h-4" /> Overall Feedback
                            </h4>
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {q.feedback || <span className="italic text-gray-400">No feedback available.</span>}
                            </div>
                          </div>

                          {/* Strengths & Improvements */}
                          {((q.strengths && q.strengths.length > 0) || (q.improvements && q.improvements.length > 0)) && (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {q.strengths && q.strengths.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Strengths</h4>
                                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-4">
                                    {q.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                              {q.improvements && q.improvements.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600">Improvements</h4>
                                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-4">
                                    {q.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expected Concepts */}
                          {q.expectedConcepts && q.expectedConcepts.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">Expected Concepts</h4>
                              <div className="flex flex-wrap gap-2">
                                {q.expectedConcepts.map((concept, i) => {
                                  const isCovered = q.answer && q.answer.toLowerCase().includes(concept.toLowerCase());
                                  return (
                                    <span key={i} className={`px-2.5 py-1 flex items-center gap-1.5 border text-xs font-medium rounded-md ${
                                      isCovered 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                                        : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-950 dark:text-gray-500 dark:border-gray-800'
                                    }`}>
                                      {isCovered ? <CheckCircle2 className="w-3 h-3" /> : null}
                                      {concept}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
