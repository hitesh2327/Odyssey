'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useAuthStore } from '@/store/auth.store';
import { useHistory } from '@/hooks/use-history';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, ArrowRight, CheckCircle, XCircle, Clock, Activity, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/shell/PageHeader';

export default function HistoryPage() {
  const { isLoading: isAuthLoading } = useProtectedRoute();
  const { user } = useAuthStore();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    topicId: '',
    difficulty: '',
    status: '',
    performanceLevel: '',
  });

  const { data: historyData, isLoading } = useHistory(page, 10, filters);

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  const StatusBadge = ({ status, evalStatus }: { status: string; evalStatus: string }) => {
    if (status === 'IN_PROGRESS') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> In Progress</span>;
    if (status === 'COMPLETED') {
      if (evalStatus === 'COMPLETED') return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Completed</span>;
      if (evalStatus === 'PROCESSING') return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><Activity className="w-3 h-3" /> Evaluating...</span>;
      if (evalStatus === 'FAILED') return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Eval Failed</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full w-fit">{status}</span>;
  };

  const PerformanceBadge = ({ level }: { level: string }) => {
    let colors = 'bg-gray-100 text-gray-700';
    if (level === 'Excellent') colors = 'bg-green-100 text-green-700';
    else if (level === 'Strong') colors = 'bg-teal-100 text-teal-700';
    else if (level === 'Good') colors = 'bg-blue-100 text-blue-700';
    else if (level === 'Average') colors = 'bg-orange-100 text-orange-700';
    else if (level === 'Needs Improvement') colors = 'bg-red-100 text-red-700';
    
    return <span className={`px-2 py-1 ${colors} text-xs font-semibold rounded-full w-fit`}>{level}</span>;
  };

  return (
    <>
      <PageHeader
        eyebrow="History · Past Sessions"
        title="Assessment History"
        subtitle="Review your past performance and resume active sessions."
      />

        <Card>
          <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full">
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <Filter className="w-5 h-5" /> Filters:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                <select 
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <option value="">All Difficulties</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>

                <select 
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <select 
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
                  value={filters.performanceLevel}
                  onChange={(e) => handleFilterChange('performanceLevel', e.target.value)}
                >
                  <option value="">All Performances</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Strong">Strong</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : historyData?.items?.length ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto p-6">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium rounded-tl-lg">Topic</th>
                        <th className="px-4 py-3 font-medium">Score</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium rounded-tr-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {historyData.items.map((item) => (
                        <tr key={item.sessionId} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{item.topic}</div>
                            <div className="text-xs text-gray-500 mt-1">{item.difficulty} • {item.duration}m</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900 dark:text-white mb-1">
                              {item.score !== null ? `${item.score}%` : '-'}
                            </div>
                            {item.performanceLevel !== 'Pending' && <PerformanceBadge level={item.performanceLevel} />}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={item.status} evalStatus={item.evaluationStatus} />
                          </td>
                          <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                            {format(new Date(item.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-4">
                            {item.status === 'COMPLETED' ? (
                              <button 
                                onClick={() => router.push(`/summary/${item.sessionId}`)}
                                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center text-sm"
                              >
                                View Summary <ArrowRight className="w-4 h-4 ml-1" />
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

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-4">
                  {historyData.items.map((item) => (
                    <div key={item.sessionId} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-lg">{item.topic}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.difficulty} • {format(new Date(item.createdAt), 'MMM d, yyyy')}</div>
                        </div>
                        <StatusBadge status={item.status} evalStatus={item.evaluationStatus} />
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.score !== null ? `Score: ${item.score}%` : 'Score: -'}
                          </div>
                          {item.performanceLevel !== 'Pending' && (
                            <div className="mt-1"><PerformanceBadge level={item.performanceLevel} /></div>
                          )}
                        </div>
                        {item.status === 'COMPLETED' ? (
                          <button 
                            onClick={() => router.push(`/summary/${item.sessionId}`)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                          >
                            Summary <ArrowRight className="w-4 h-4 ml-1" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => router.push(`/interview/${item.sessionId}`)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                          >
                            Resume <PlayCircle className="w-4 h-4 ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination controls */}
                {historyData.totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/30 rounded-b-xl">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-white dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {historyData.totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(historyData.totalPages, p + 1))}
                      disabled={page === historyData.totalPages}
                      className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-white dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No history found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {Object.values(filters).some(Boolean) 
                    ? "Try adjusting your filters to see more results." 
                    : "You haven't completed any assessments yet. Start a new session from the dashboard!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

    </>
  );
}
