import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { History, Layers, CheckCircle2, Clock, Calendar, ArrowRight, Tag } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [mockHistory, setMockHistory] = useState<any[]>([]);
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const [mocks, attempts] = await Promise.all([
          api.mocks.getMyHistory(),
          api.attempts.getMyAttempts(),
        ]);
        setMockHistory(mocks);
        setAllAttempts(attempts);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Candidate Examination History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive log of assigned tests, Full Mock combinations, and completion records
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Retrieving test audit logs...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Full Mock Examinations Log */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Full Mock Assignments & Progress
              </h2>
            </div>

            {mockHistory.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
                No Full Mock examinations attempted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {mockHistory.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                          Full Mock #{m.mockNumber}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-mono mt-1 sm:mt-0">
                        Started: {new Date(m.startedAt).toLocaleString()}
                        {m.completedAt && (
                          <span className="ml-2">
                            • Completed: {new Date(m.completedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Exact Assigned Tests Record (Requirement 8) */}
                    <div className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded border border-slate-200">
                      <div className="font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                        Assigned Test Configuration:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-blue-700">Listening:</span>
                          <span className="text-slate-900 font-semibold">
                            Test {m.listeningTest?.testNumber} (v{m.listeningVersion?.versionNumber})
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sky-700">Reading:</span>
                          <span className="text-slate-900 font-semibold">
                            Test {m.readingTest?.testNumber} (v{m.readingVersion?.versionNumber})
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-emerald-700">Writing:</span>
                          <span className="text-slate-900 font-semibold">
                            Test {m.writingTest?.testNumber} (v{m.writingVersion?.versionNumber})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Complete Activity History Log */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                All Section Attempts Timeline
              </h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Context</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Band Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 text-slate-600 font-mono">
                        {new Date(att.startedAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {att.section}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {att.test?.title || `Test ${att.test?.testNumber}`}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        v{att.testVersion?.versionNumber || 1}
                      </td>
                      <td className="py-2.5 px-4">
                        {att.fullMockAttempt ? (
                          <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
                            Mock #{att.fullMockAttempt.mockNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500">Single</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                            att.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : att.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {att.bandScore !== null && att.bandScore !== undefined
                          ? att.bandScore.toFixed(1)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
