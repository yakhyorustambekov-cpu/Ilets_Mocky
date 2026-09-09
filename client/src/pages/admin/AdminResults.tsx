import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Award, FileText, CheckCircle2, User } from 'lucide-react';

export const AdminResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await api.admin.getResults();
        setResults(data);
      } catch (err) {
        console.error('Error loading results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Score Ledgers & Candidate Results
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified examination scores, raw answers, and IELTS band score calculations
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading scored results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-xs text-slate-500">
          No scored results recorded yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Recorded At</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Candidate ID</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4 text-center">Raw Score</th>
                <th className="py-3 px-4 text-right">Band Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {r.testAttempt?.user?.firstName} {r.testAttempt?.user?.lastName}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    {r.testAttempt?.user?.candidateNumber || 'CDI-CANDIDATE'}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">
                    {r.section}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    {r.testAttempt?.test?.title || `Test ${r.testAttempt?.test?.testNumber}`}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono">
                    {r.rawScore !== null ? `${r.rawScore} / ${r.maxScore || 40}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {r.bandScore !== null ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {r.bandScore.toFixed(1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
