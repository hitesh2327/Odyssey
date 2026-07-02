'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useAuthStore } from '@/store/auth.store';
import { useTopics } from '@/hooks/use-topics';
import { useCreateSession } from '@/hooks/use-sessions';
import { useDashboardOverview, useDashboardHistory, useDashboardPerformance } from '@/hooks/use-dashboard';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '@/components/shell/PageHeader';
import { InstrumentPanel } from '@/components/ui/InstrumentPanel';
import { PerformanceTrendChart } from '@/components/dashboard/PerformanceTrendChart';
import { PerformanceByTopicChart } from '@/components/dashboard/PerformanceByTopicChart';
import { RecentAssessmentsTable } from '@/components/dashboard/RecentAssessmentsTable';
import { ResumeAssessmentCard } from '@/components/dashboard/ResumeAssessmentCard';
import { ChartACourseCard } from '@/components/dashboard/ChartACourseCard';
import { useProfile } from '@/hooks/use-profile';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { isLoading: isAuthLoading } = useProtectedRoute();
  const { user } = useAuthStore();
  const router = useRouter();

  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionTopicIds, setNewSessionTopicIds] = useState<string[]>([]);
  const [customTopicName, setCustomTopicName] = useState<string>('');
  const [newSessionDifficulty, setNewSessionDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');

  const { data: topics, isLoading: isTopicsLoading } = useTopics();
  const { mutate: createSession, isPending: isCreating } = useCreateSession();

  const { data: overview, isLoading: isOverviewLoading, refetch: refetchOverview } = useDashboardOverview();
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useDashboardHistory();
  const { data: performanceData, isLoading: isPerformanceLoading, refetch: refetchPerformance } = useDashboardPerformance();
  const { data: profile } = useProfile();

  useEffect(() => {
    refetchOverview();
    refetchHistory();
    refetchPerformance();
  }, [refetchOverview, refetchHistory, refetchPerformance]);

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
    createSession({ topicIds: [selectedTopic.id], difficulty }, {
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
    let finalTopicIds = [...newSessionTopicIds];
    if (customTopicName.trim()) {
      if (!finalTopicIds.includes(customTopicName.trim())) {
        finalTopicIds.push(customTopicName.trim());
      }
    }
    if (finalTopicIds.length === 0) {
      toast.error('Please select or enter at least one topic');
      return;
    }
    if (finalTopicIds.length > 5) {
      toast.error('Maximum 5 topics allowed');
      return;
    }

    createSession({ topicIds: finalTopicIds, difficulty: newSessionDifficulty }, {
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

  // Transform history data for the table
  const mappedAssessments = historyData?.items?.map(item => ({
    topic: item.topic,
    level: item.difficulty,
    status: item.status === 'COMPLETED' ? 'completed' as const : 'in_progress' as const,
    score: item.score,
    sessionId: item.sessionId
  })) || [];

  // Use mock suggestions or topics if available
  const suggestions = topics?.slice(0, 5).map(t => ({ id: t.id, name: t.name })) || [
    { id: 'aws', name: 'AWS' },
    { id: 'azure', name: 'Azure' },
    { id: 'django', name: 'Django' },
    { id: 'docker', name: 'Docker' },
    { id: 'express', name: 'Express.js' }
  ];

  // Map instrument panel stats (real + fallback to mock)
  const stats = {
    totalSessions: overview?.totalAssessments ?? profile?.stats.totalSessions ?? 0,
    completed: overview?.completedAssessments ?? profile?.stats.completedSessions ?? 0,
    avgScore: overview?.averageScore ?? profile?.stats.avgScore ?? 0,
    aiUses: overview?.totalAiUsage ?? profile?.stats.aiUsesThisMonth ?? 0,
  };

  // return (
  return (
    <>
      <PageHeader
        eyebrow={`Dashboard · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
        title="Ready for today's heading?"
        subtitle="Resume the assessment already underway, or chart a course into a new topic."
        cta={
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="font-sans text-[14px] font-semibold border-none rounded-[9px] p-[11px_20px] cursor-pointer inline-flex items-center gap-[8px] whitespace-nowrap bg-brass text-ink hover:bg-[#c79644] transition-colors focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-2 focus:ring-offset-parchment"
          >
            ⚓ Start New Assessment
          </button>
        }
      />

      <InstrumentPanel stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[22px] items-start">
        <div>
          <PerformanceTrendChart trend={overview?.trend || []} />
          <PerformanceByTopicChart topics={performanceData?.topics || []} />
          <RecentAssessmentsTable assessments={mappedAssessments} />
        </div>

        <div>
          {overview?.activeSessions && overview.activeSessions.length > 0 ? (
            overview.activeSessions.slice(0, 1).map(session => (
              <ResumeAssessmentCard 
                key={session.sessionId}
                assessment={{
                  topic: session.topic,
                  level: session.difficulty,
                  completedModules: 2, // Mocking these since backend doesn't provide them
                  totalModules: 5,
                  sessionId: session.sessionId
                }} 
              />
            ))
          ) : (
            <ResumeAssessmentCard 
              assessment={{
                topic: "PostgreSQL",
                level: "INTERMEDIATE",
                completedModules: 2,
                totalModules: 5
              }} 
            />
          )}

          <ChartACourseCard suggestions={suggestions} />
        </div>
      </div>

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
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Select Topics (Max 5)</label>
            <div className="flex flex-wrap gap-2">
              {topics?.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => {
                    if (newSessionTopicIds.includes(topic.id)) {
                      setNewSessionTopicIds(prev => prev.filter(id => id !== topic.id));
                    } else {
                      if (newSessionTopicIds.length >= 5) {
                        toast.error('Maximum 5 topics allowed');
                        return;
                      }
                      setNewSessionTopicIds(prev => [...prev, topic.id]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    newSessionTopicIds.includes(topic.id)
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-500'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
            
            <label className="text-sm font-semibold text-gray-900 dark:text-white mt-4 block">Add Custom Topic</label>
            <input
              type="text"
              placeholder="E.g. System Design, Kubernetes, etc."
              value={customTopicName}
              onChange={(e) => setCustomTopicName(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
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
            disabled={isCreating || (newSessionTopicIds.length === 0 && !customTopicName.trim())}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
          >
            {isCreating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            Start Assessment
          </button>
        </div>
      </Modal>
    </>
  );
}
