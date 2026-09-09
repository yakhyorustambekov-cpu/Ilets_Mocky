import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Users,
  Layers,
  CheckCircle2,
  Clock,
  Headphones,
  BookOpen,
  Edit3,
  PlusCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.admin.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          Loading Examiner Metrics...
        </p>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] uppercase font-mono font-bold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              Administration Control Center
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            IELTS Examiner Operations Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test inventory monitoring, student progress tracking, and examination attempt oversight
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/tests"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Upload New Test
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Candidates */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Candidates</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats?.totalStudents || 0}
            </span>
            <span className="ml-2 text-xs text-slate-500">registered</span>
          </div>
        </div>

        {/* Total Tests Inventory */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Published Tests</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats?.publishedTests || 0}
            </span>
            <span className="ml-2 text-xs text-slate-500">
              of {stats?.totalTests || 0} total
            </span>
          </div>
        </div>

        {/* Completed Attempts */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Attempts</span>
            <FileCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats?.attempts?.completed || 0}
            </span>
            <span className="ml-2 text-xs text-slate-500">
              / {stats?.attempts?.total || 0} started
            </span>
          </div>
        </div>

        {/* Full Mock Simulations */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Full Mocks</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats?.fullMocks?.completed || 0}
            </span>
            <span className="ml-2 text-xs text-slate-500">
              completed ({stats?.fullMocks?.total || 0} started)
            </span>
          </div>
        </div>
      </div>

      {/* Section Tests Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded bg-blue-50 text-blue-600">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Listening Pool</div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {stats?.sectionBreakdown?.listening || 0} Published Tests
              </div>
            </div>
          </div>
          <Link to="/admin/tests?section=LISTENING" className="text-xs font-bold text-blue-600 hover:underline">
            Manage &rarr;
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded bg-sky-50 text-sky-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Reading Pool</div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {stats?.sectionBreakdown?.reading || 0} Published Tests
              </div>
            </div>
          </div>
          <Link to="/admin/tests?section=READING" className="text-xs font-bold text-blue-600 hover:underline">
            Manage &rarr;
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded bg-emerald-50 text-emerald-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Writing Pool</div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {stats?.sectionBreakdown?.writing || 0} Published Tests
              </div>
            </div>
          </div>
          <Link to="/admin/tests?section=WRITING" className="text-xs font-bold text-blue-600 hover:underline">
            Manage &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Platform Attempts Audit Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-500" />
            Recent Candidate Activity Across Platform
          </h2>
          <Link to="/admin/attempts" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Attempts &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Candidate ID</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Test Title</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentAttempts?.map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 text-slate-600 font-mono">
                    {new Date(att.startedAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {att.user?.firstName} {att.user?.lastName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                    {att.user?.candidateNumber || 'CDI-CANDIDATE'}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {att.test?.section}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                    {att.test?.title || `Test ${att.test?.testNumber}`} (v{att.testVersion?.versionNumber})
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
