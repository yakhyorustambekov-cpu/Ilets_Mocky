import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Clock, Filter, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const AdminAttempts: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAttempts({
        section: sectionFilter || undefined,
        status: statusFilter || undefined,
        page,
      });
      setAttempts(data.attempts);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error loading attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [sectionFilter, statusFilter, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Examination Attempts Oversight
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs of candidate sessions, test versions executed, and completion status
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 bg-white"
          >
            <option value="">All Sections</option>
            <option value="LISTENING">Listening</option>
            <option value="READING">Reading</option>
            <option value="WRITING">Writing</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ABANDONED">Abandoned</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading attempts ledger...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-xs text-slate-500">
          No attempts match the current filter.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Candidate ID</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Context</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Band Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {new Date(att.startedAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {att.user?.firstName} {att.user?.lastName}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    {att.user?.candidateNumber || 'CDI-CANDIDATE'}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">
                    {att.section}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 max-w-xs truncate">
                    {att.test?.title || `Test ${att.test?.testNumber}`}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    v{att.testVersion?.versionNumber || 1}
                  </td>
                  <td className="py-2.5 px-4">
                    {att.fullMockAttempt ? (
                      <span className="font-mono text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                        Mock #{att.fullMockAttempt.mockNumber}
                      </span>
                    ) : (
                      <span className="text-slate-500">Single</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
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
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {att.bandScore !== null && att.bandScore !== undefined
                      ? att.bandScore.toFixed(1)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 text-slate-700"
              >
                Previous
              </button>
              <span className="text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 text-slate-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
