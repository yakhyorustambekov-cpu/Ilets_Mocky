import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Award, CheckCircle2, Clock, Calendar, ArrowRight, Layers, FileText } from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [mockHistory, setMockHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MOCKS'>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const [attData, mockData] = await Promise.all([
          api.attempts.getMyAttempts(undefined, 'COMPLETED'),
          api.mocks.getMyHistory(),
        ]);
        setAttempts(attData);
        setMockHistory(mockData);
      } catch (err) {
        console.error('Error loading results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Test Results & Performance Summary
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified computer-delivered test outcomes and estimated IELTS band scores
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Section Results ({attempts.length})
        </button>
        <button
          onClick={() => setActiveTab('MOCKS')}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
            activeTab === 'MOCKS'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Full Mock Examinations ({mockHistory.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading verified results...</p>
        </div>
      ) : activeTab === 'MOCKS' ? (
        /* Full Mock Results View */
        <div className="space-y-4">
          {mockHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-xs text-slate-500">
              No Full Mock exams completed yet. Start your first mock from the Dashboard.
            </div>
          ) : (
            mockHistory.map((m) => {
              const scores = m.testAttempts?.filter((a: any) => a.bandScore !== null);
              const avgBand =
                scores && scores.length > 0
                  ? (scores.reduce((acc: number, curr: any) => acc + curr.bandScore, 0) / scores.length).toFixed(1)
                  : null;

              return (
                <div
                  key={m.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600 text-white rounded">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-900">
                            Full IELTS Mock #{m.mockNumber}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              m.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                          <span>Started: {new Date(m.startedAt).toLocaleString()}</span>
                          {m.completedAt && (
                            <span>• Completed: {new Date(m.completedAt).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {avgBand && (
                      <div className="bg-slate-50 px-4 py-2 rounded border border-slate-200 text-right">
                        <div className="text-[10px] uppercase font-mono text-slate-500">Overall Band</div>
                        <div className="text-xl font-extrabold font-mono text-blue-600">{avgBand}</div>
                      </div>
                    )}
                  </div>

                  {/* 3 Sections breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Listening</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        Test {m.listeningTest?.testNumber}: {m.listeningTest?.title}
                      </div>
                      <div className="text-xs font-mono text-blue-600 font-bold mt-1">
                        Band: {m.testAttempts?.find((a: any) => a.section === 'LISTENING')?.bandScore?.toFixed(1) || 'Recorded'}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Reading</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        Test {m.readingTest?.testNumber}: {m.readingTest?.title}
                      </div>
                      <div className="text-xs font-mono text-sky-600 font-bold mt-1">
                        Band: {m.testAttempts?.find((a: any) => a.section === 'READING')?.bandScore?.toFixed(1) || 'Recorded'}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Writing</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        Test {m.writingTest?.testNumber}: {m.writingTest?.title}
                      </div>
                      <div className="text-xs font-mono text-emerald-600 font-bold mt-1">
                        Band: {m.testAttempts?.find((a: any) => a.section === 'WRITING')?.bandScore?.toFixed(1) || 'Recorded'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* All Individual Section Results View */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {attempts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No completed test attempts recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Completion Date</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Context</th>
                  <th className="py-3 px-4 text-center">Raw Score</th>
                  <th className="py-3 px-4 text-right">Band Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {att.completedAt
                        ? new Date(att.completedAt).toLocaleString()
                        : new Date(att.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {att.section}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {att.test?.title || `Test ${att.test?.testNumber}`}
                    </td>
                    <td className="py-3 px-4">
                      {att.fullMockAttempt ? (
                        <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
                          Full Mock #{att.fullMockAttempt.mockNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Individual Practice</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {att.rawScore !== null ? `${att.rawScore} / ${att.maxScore || 40}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {att.bandScore !== null ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {att.bandScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
