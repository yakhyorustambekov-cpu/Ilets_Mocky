import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Users, Eye, Target, Calendar, Award, Layers, Clock, X } from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleViewStudent = async (studentId: string) => {
    setDetailLoading(true);
    try {
      const detail = await api.admin.getStudentById(studentId);
      setSelectedStudent(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load student details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Registered Candidates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor candidate progress, mock examination participation, and target band scores
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading student roster...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidate Number</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Target Band</th>
                <th className="py-3 px-4 text-center">Single Attempts</th>
                <th className="py-3 px-4 text-center">Full Mocks</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {s.candidateNumber || 'CDI-CANDIDATE'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {s.email}
                  </td>
                  <td className="py-3 px-4">
                    {s.targetBand ? (
                      <span className="font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        Band {s.targetBand.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                    {s.totalAttempts}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                    {s.totalFullMocks}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleViewStudent(s.id)}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Dossier Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Candidate ID: {selectedStudent.candidateNumber || 'CDI-CANDIDATE'} • {selectedStudent.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Randomization Cycle Tracking (Requirement 6 & 13) */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Active Anti-Repeat Randomization Cycles
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedStudent.randomizationCycles?.map((c: any) => (
                    <div key={c.id} className="bg-slate-50 p-3 rounded border border-slate-200">
                      <div className="font-bold text-slate-600 uppercase text-[10px]">{c.section}</div>
                      <div className="text-sm font-bold font-mono text-blue-600 mt-0.5">
                        Cycle #{c.currentCycle}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Last reset: {new Date(c.lastResetAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Mock History */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Full Mock Assignments ({selectedStudent.fullMockAttempts?.length || 0})
                </h4>
                {selectedStudent.fullMockAttempts?.length === 0 ? (
                  <p className="text-slate-400 italic">No full mock attempts recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.fullMockAttempts?.map((m: any) => (
                      <div key={m.id} className="bg-slate-50 p-3 rounded border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold font-mono text-blue-600">
                            Full Mock #{m.mockNumber}
                          </span>
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {m.status}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-600">
                          Listening: Test {m.listeningTest?.testNumber} • Reading: Test {m.readingTest?.testNumber} • Writing: Test {m.writingTest?.testNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
