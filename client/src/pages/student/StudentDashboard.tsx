import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Headphones,
  BookOpen,
  Edit3,
  Layers,
  ArrowRight,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  Target,
  PlayCircle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [testCounts, setTestCounts] = useState<{ listening: number; reading: number; writing: number } | null>(null);
  const [activeMock, setActiveMock] = useState<any>(null);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [countsData, mockData, attemptsData] = await Promise.all([
          api.tests.getCounts(),
          api.mocks.getCurrent(),
          api.attempts.getMyAttempts(undefined, undefined),
        ]);

        setTestCounts(countsData);
        setActiveMock(mockData.activeMock);
        setRecentAttempts(attemptsData.slice(0, 5));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Candidate Profile Summary Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Candidate: {user?.firstName} {user?.lastName}
              </h1>
              <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-300">
                {user?.candidateNumber || 'CDI-CANDIDATE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Computer-Delivered IELTS Academic Mock Testing Workspace
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-600 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Target Band: <strong>{user?.profile?.targetBand ? user.profile.targetBand.toFixed(1) : 'Not set'}</strong></span>
            </div>
            {user?.profile?.examDate && (
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Exam Date: <strong>{user.profile.examDate}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Progress Full Mock Alert Banner */}
      {activeMock && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold font-mono uppercase bg-blue-600 text-white px-2 py-0.5 rounded">
                    Mock #{activeMock.mockNumber}
                  </span>
                  <span className="text-xs font-semibold text-blue-900">
                    Test In Progress — Resumable
                  </span>
                </div>
                <div className="text-xs text-blue-800 mt-1">
                  Assigned: <strong>Listening Test {activeMock.listeningTest?.testNumber}</strong>,{' '}
                  <strong>Reading Test {activeMock.readingTest?.testNumber}</strong>,{' '}
                  <strong>Writing Test {activeMock.writingTest?.testNumber}</strong>. Currently at section: <strong>{activeMock.currentSection}</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/student/mock/runner')}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition-colors whitespace-nowrap"
            >
              <PlayCircle className="w-4 h-4 mr-1.5" />
              Resume Full Mock
            </button>
          </div>
        </div>
      )}

      {/* The 4 Core Practice Options (Requirement 3) */}
      <div className="mb-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Examination Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Full Listening */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
            <div>
              <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Full Listening
              </h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                40 questions / 4 parts. Real audio playback, map labeling, and form completion.
              </p>
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-4">
                Time Limit: 32 minutes
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {testCounts?.listening || 0} tests available
              </span>
              <Link
                to="/student/listening"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Open Library <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* Full Reading */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
            <div>
              <div className="w-10 h-10 rounded bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Full Reading
              </h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                40 questions / 3 passages. Authentic academic texts, split-screen viewing, and True/False.
              </p>
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-4">
                Time Limit: 60 minutes
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {testCounts?.reading || 0} tests available
              </span>
              <Link
                to="/student/reading"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Open Library <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* Full Writing */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
            <div>
              <div className="w-10 h-10 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Full Writing
              </h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Task 1 (150 words) + Task 2 (250 words). Structured input editors and live word counts.
              </p>
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-4">
                Time Limit: 60 minutes
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {testCounts?.writing || 0} tests available
              </span>
              <Link
                to="/student/writing"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Open Library <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* Full IELTS Mock */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-lg p-5 flex flex-col justify-between shadow-md">
            <div>
              <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1.5 mb-1">
                <h3 className="text-base font-bold text-white">
                  Full IELTS Mock
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                  Simulation
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Listening + Reading + Writing. Server-side randomized tests with anti-repeat pool cycle.
              </p>
              <div className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 mb-4">
                Full Duration: ~2h 35m
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Sequential exam
              </span>
              <Link
                to="/student/mock"
                className="inline-flex items-center text-xs font-bold text-blue-400 hover:text-blue-300"
              >
                Start Mock <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Test Attempts
          </h2>
          <Link
            to="/student/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View Complete History &rarr;
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No test attempts recorded yet. Choose a module above to begin your preparation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Test Title</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Band Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {new Date(att.startedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {att.section}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                      {att.test?.title || `Test ${att.test?.testNumber}`}
                    </td>
                    <td className="py-2.5 px-3">
                      {att.fullMockAttempt ? (
                        <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-medium border border-blue-100">
                          Mock #{att.fullMockAttempt.mockNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Individual</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          att.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : att.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {att.bandScore !== null && att.bandScore !== undefined ? (
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
          </div>
        )}
      </div>
    </div>
  );
};
