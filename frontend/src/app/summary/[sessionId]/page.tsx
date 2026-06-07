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

  const scoreClasses: Record<string, any> = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      ring: "border-emerald-500",
      badgeBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border-emerald-200",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      ring: "border-blue-500",
      badgeBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-blue-200",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      ring: "border-amber-500",
      badgeBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border-amber-200",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-950",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
      ring: "border-orange-500",
      badgeBg: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 border-orange-200",
    }
  };

  const getScoreTheme = (score: number | null) => {
    if (score === null) return scoreClasses.orange;
    if (score >= 90) return scoreClasses.emerald;
    if (score >= 70) return scoreClasses.blue;
    if (score >= 50) return scoreClasses.amber;
    return scoreClasses.orange;
  };

  const theme = getScoreTheme(overallScore);

  const globalStrengths = Array.from(new Set(questions.flatMap(q => q.strengths || []))).slice(0, 5);
  const globalImprovements = Array.from(new Set(questions.flatMap(q => q.improvements || []))).slice(0, 5);

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
        <div className="bg-white dark:bg-zinc-950 rounded-3xl p-8 md:p-12 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className={`relative w-40 h-40 flex items-center justify-center rounded-full ${theme.bg} border-[12px] ${theme.ring} dark:border-opacity-40`}>
              {evaluationStatus === 'COMPLETED' ? (
                <div className="text-center">
                  <span className={`text-5xl font-black ${theme.text} leading-none`}>
                    {overallScore}
                  </span>
                  <span className="text-xl text-zinc-400 block mt-1">/100</span>
                </div>
              ) : (
                <div className="text-orange-500 font-bold">Failed</div>
              )}
            </div>
            <div className={`mt-6 px-4 py-1.5 rounded-full border ${theme.badgeBg} text-sm font-bold tracking-wide uppercase`}>
              {performanceLevel}
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Overall Feedback</h2>
            <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 p-6 rounded-2xl">
              <p className="text-lg text-violet-900 dark:text-violet-300 leading-relaxed">
                {overallFeedback || "No feedback generated."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <Clock className="w-4 h-4" /> {statistics.durationInMinutes} mins
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800/30">
                <Sparkles className="w-4 h-4 text-violet-500" /> AI Used {statistics.aiAssistUsed} times
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {(globalStrengths.length > 0 || globalImprovements.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {globalStrengths.length > 0 && (
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {globalStrengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-zinc-700 dark:text-zinc-300 text-sm">
                      <span className="text-emerald-500 shrink-0">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {globalImprovements.length > 0 && (
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Focus Areas
                </h3>
                <ul className="space-y-2">
                  {globalImprovements.map((s, i) => (
                    <li key={i} className="flex gap-2 text-zinc-700 dark:text-zinc-300 text-sm">
                      <span className="text-blue-500 shrink-0">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Detailed Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Question Review</h2>
          <div className="space-y-4">
            {questions.map((q) => {
              const isExpanded = !!expandedQs[q.questionId];
              const qTheme = getScoreTheme(q.score);
              return (
                <Card key={q.questionId} className="overflow-hidden transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800">
                  <div 
                    onClick={() => toggleQ(q.questionId)}
                    className="cursor-pointer border-b border-transparent hover:bg-zinc-50/50 px-6 py-5 dark:hover:bg-zinc-900/30 flex justify-between items-center transition-colors group"
                  >
                    <div className="flex-1 pr-6 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full ${qTheme.bg} ${qTheme.text} font-bold text-sm border ${qTheme.border}`}>
                          {q.questionOrder}
                        </span>
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white line-clamp-2 md:line-clamp-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {q.questionText}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-11">
                        <span className={`text-sm font-semibold ${qTheme.text}`}>
                          Score: {q.score !== null ? `${q.score}/100` : '-'}
                        </span>
                        {q.usedAI && (
                          <span className="flex items-center space-x-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800/30">
                            <Sparkles className="h-3 w-3" /> AI Assisted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <CardContent className="p-0 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
                        {/* User Answer */}
                        <div className="p-6 space-y-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                            Your Answer
                          </h4>
                          <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            {q.answer || <span className="italic text-zinc-400">No answer provided.</span>}
                          </div>
                        </div>

                        {/* AI Evaluation */}
                        <div className="p-6 space-y-6">
                          
                          {/* Breakdown Scores */}
                          {q.breakdown && Object.keys(q.breakdown).length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Evaluation Breakdown</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(q.breakdown).map(([key, value]) => {
                                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                  const score = Number(value);
                                  
                                  // Map semantic color
                                  let colorClass = "text-indigo-600 dark:text-indigo-400";
                                  if (key.toLowerCase().includes('problem')) colorClass = "text-emerald-600 dark:text-emerald-400";
                                  if (key.toLowerCase().includes('communication')) colorClass = "text-cyan-600 dark:text-cyan-400";

                                  return (
                                    <div key={key} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg shadow-sm">
                                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">{label}</span>
                                      <span className={`font-bold ${colorClass}`}>{score}/20</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Feedback */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-2">
                              <BrainCircuit className="w-4 h-4" /> Question Feedback
                            </h4>
                            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                              {q.feedback || <span className="italic text-zinc-400">No feedback available.</span>}
                            </div>
                          </div>

                          {/* Strengths & Improvements */}
                          {((q.strengths && q.strengths.length > 0) || (q.improvements && q.improvements.length > 0)) && (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {q.strengths && q.strengths.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Strengths</h4>
                                  <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4">
                                    {q.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                              {q.improvements && q.improvements.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">Improvements</h4>
                                  <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1 list-disc pl-4">
                                    {q.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expected Concepts */}
                          {q.expectedConcepts && q.expectedConcepts.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Expected Concepts</h4>
                              <div className="flex flex-wrap gap-2">
                                {q.expectedConcepts.map((concept, i) => {
                                  const isCovered = q.answer && q.answer.toLowerCase().includes(concept.toLowerCase());
                                  const isAISuggested = !isCovered && q.usedAI;
                                  
                                  return (
                                    <span key={i} className={`px-2.5 py-1 flex items-center gap-1.5 border text-xs font-medium rounded-md transition-colors ${
                                      isCovered 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                                        : isAISuggested
                                        ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800'
                                        : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
                                    }`}>
                                      {isCovered ? <CheckCircle2 className="w-3 h-3" /> : isAISuggested ? <Sparkles className="w-3 h-3" /> : null}
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
