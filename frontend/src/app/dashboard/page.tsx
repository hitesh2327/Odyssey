'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useAuthStore } from '@/store/auth.store';
import { useTopics } from '@/hooks/use-topics';
import { useCreateSession } from '@/hooks/use-sessions';
import { useDashboardOverview, useDashboardHistory, useDashboardPerformance } from '@/hooks/use-dashboard';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, BookOpen, Clock, Activity, Target, Zap, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PerformanceTrendChart, PerformanceTopicChart } from '@/components/dashboard/charts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { isLoading: isAuthLoading } = useProtectedRoute();
  const { user } = useAuthStore();
  const router = useRouter();

  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionTopicId, setNewSessionTopicId] = useState<string>('');
  const [customTopicName, setCustomTopicName] = useState<string>('');
  const [newSessionDifficulty, setNewSessionDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');

  const { data: topics, isLoading: isTopicsLoading } = useTopics();
  const { mutate: createSession, isPending: isCreating } = useCreateSession();

  const { data: overview, isLoading: isOverviewLoading } = useDashboardOverview();
  const { data: historyData, isLoading: isHistoryLoading } = useDashboardHistory();
  const { data: performanceData, isLoading: isPerformanceLoading } = useDashboardPerformance();

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  const handleStartSession = (difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') => {
    if (!selectedTopic) return;
    createSession({ topicId: selectedTopic.id, difficulty }, {
      onSuccess: (data) => {
        toast.success('Session created successfully!');
        router.push(`/interview/${data.sessionId}?q=1`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create session');
      }
    });
  };

  const handleStartNewSession = () => {
    const finalTopicId = newSessionTopicId === 'custom' ? customTopicName.trim() : newSessionTopicId;
    if (!finalTopicId) {
      toast.error('Please select or enter a topic');
      return;
    }
    createSession({ topicId: finalTopicId, difficulty: newSessionDifficulty }, {
      onSuccess: (data) => {
        toast.success('Session created successfully!');
        setIsNewSessionModalOpen(false);
        router.push(`/interview/${data.sessionId}?q=1`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create session');
      }
    });
  };

  const StatusBadge = ({ status, evalStatus }: { status: string; evalStatus: string }) => {
    if (status === 'IN_PROGRESS') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
    if (status === 'COMPLETED') {
      if (evalStatus === 'COMPLETED') return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      if (evalStatus === 'PROCESSING') return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1"><Activity className="w-3 h-3" /> Evaluating...</span>;
      if (evalStatus === 'FAILED') return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Eval Failed</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        
        {/* Section 1: Welcome Area */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
            <p className="mt-2 text-indigo-100 max-w-2xl text-lg">
              Ready to level up your interview skills today? Dive back into an active session or explore a new topic.
            </p>
          </div>
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="shrink-0 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" /> Start New Assessment
          </button>
        </div>

        {/* Section 2: Statistics Cards */}
        {isOverviewLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalAssessments}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview.completedAssessments}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Score</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview.averageScore}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Uses</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalAiUsage}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Section 4: Performance Trend */}
            {isOverviewLoading ? (
              <Skeleton className="h-[400px] rounded-xl w-full" />
            ) : (
              <PerformanceTrendChart data={overview?.trend || []} />
            )}

            {/* Section 5: Performance By Topic */}
            {isPerformanceLoading ? (
              <Skeleton className="h-[400px] rounded-xl w-full" />
            ) : (
              <PerformanceTopicChart data={performanceData?.topics || []} />
            )}

            {/* Section 6: Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                {isHistoryLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : historyData?.items?.length ? (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                          <tr>
                            <th className="px-4 py-3 font-medium rounded-tl-lg">Topic</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Score</th>
                            <th className="px-4 py-3 font-medium rounded-tr-lg">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {historyData.items.slice(0, 5).map((item) => (
                            <tr key={item.sessionId} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="font-medium text-gray-900 dark:text-white">{item.topic}</div>
                                <div className="text-xs text-gray-500">{item.difficulty}</div>
                              </td>
                              <td className="px-4 py-4">
                                <StatusBadge status={item.status} evalStatus={item.evaluationStatus} />
                              </td>
                              <td className="px-4 py-4 font-semibold text-gray-700 dark:text-gray-300">
                                {item.score !== null ? `${item.score}%` : '-'}
                              </td>
                              <td className="px-4 py-4">
                                {item.status === 'COMPLETED' ? (
                                  <button 
                                    onClick={() => router.push(`/summary/${item.sessionId}`)}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center text-sm"
                                  >
                                    View Result <ArrowRight className="w-4 h-4 ml-1" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => router.push(`/interview/${item.sessionId}`)}
                                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
                                  >
                                    Resume <PlayCircle className="w-4 h-4 ml-1" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden space-y-4">
                      {historyData.items.slice(0, 5).map((item) => (
                        <div key={item.sessionId} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{item.topic}</div>
                              <div className="text-xs text-gray-500">{item.difficulty}</div>
                            </div>
                            <StatusBadge status={item.status} evalStatus={item.evaluationStatus} />
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="font-semibold text-gray-700 dark:text-gray-300">
                              {item.score !== null ? `Score: ${item.score}%` : 'Score: -'}
                            </div>
                            {item.status === 'COMPLETED' ? (
                              <button 
                                onClick={() => router.push(`/summary/${item.sessionId}`)}
                                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center text-sm"
                              >
                                View Result <ArrowRight className="w-4 h-4 ml-1" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => router.push(`/interview/${item.sessionId}`)}
                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
                              >
                                Resume <PlayCircle className="w-4 h-4 ml-1" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">No assessments found.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Section 3: Resume Assessments */}
            {overview?.activeSessions && overview.activeSessions.length > 0 && (
              <Card className="border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                <CardHeader>
                  <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Resume Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overview.activeSessions.map((session) => (
                    <div 
                      key={session.sessionId} 
                      onClick={() => router.push(`/interview/${session.sessionId}`)}
                      className="group cursor-pointer bg-white dark:bg-gray-950 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{session.topic}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Progress: {session.progress} • {session.difficulty}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Section 7: Quick Start Topics */}
            <Card id="quick-start" className="scroll-mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isTopicsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topics?.slice(0, 5).map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic({ id: topic.id, name: topic.name })}
                        className="w-full text-left bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white">{topic.name}</h4>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Difficulty Selection Modal */}
      <Modal
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        title="Select Difficulty"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a difficulty level for your <strong className="text-gray-900 dark:text-white">{selectedTopic?.name}</strong> assessment.
          </p>
          <div className="grid gap-3">
            {[
              { level: 'BEGINNER', desc: 'Fundamental concepts and basic syntax.' },
              { level: 'INTERMEDIATE', desc: 'Core patterns and practical problem solving.' },
              { level: 'ADVANCED', desc: 'Deep architecture and complex scenarios.' }
            ].map(({ level, desc }) => (
              <button
                key={level}
                onClick={() => handleStartSession(level as any)}
                disabled={isCreating}
                className="flex items-center justify-between w-full p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all dark:border-gray-800 dark:bg-gray-950 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 disabled:opacity-50"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{level.toLowerCase()}</h4>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
                <PlayCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
      {/* Start New Assessment Modal */}
      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        title="Start New Assessment"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Select Topic</label>
            <select 
              value={newSessionTopicId}
              onChange={(e) => setNewSessionTopicId(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="" disabled>Choose a topic...</option>
              {topics?.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
              <option value="custom">+ Custom Topic</option>
            </select>
            {newSessionTopicId === 'custom' && (
              <input
                type="text"
                placeholder="E.g. System Design, Kubernetes, etc."
                value={customTopicName}
                onChange={(e) => setCustomTopicName(e.target.value)}
                className="w-full mt-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Select Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setNewSessionDifficulty(level)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all capitalize ${
                    newSessionDifficulty === level 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-300' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 dark:hover:border-gray-700'
                  }`}
                >
                  {level.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartNewSession}
            disabled={isCreating || !newSessionTopicId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
          >
            {isCreating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            Start Assessment
          </button>
        </div>
      </Modal>
    </div>
  );
}
