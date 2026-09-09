import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Headphones,
  BookOpen,
  Edit3,
  Clock,
  Play,
  Award,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface TestLibraryProps {
  section: 'LISTENING' | 'READING' | 'WRITING';
}

export const TestLibrary: React.FC<TestLibraryProps> = ({ section }) => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sectionMeta = {
    LISTENING: {
      title: 'Full Listening',
      subtitle: 'Official IELTS Academic format: 40 questions across 4 audio recordings',
      icon: Headphones,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      duration: '32 minutes',
    },
    READING: {
      title: 'Full Reading',
      subtitle: 'Official IELTS Academic format: 40 questions across 3 authentic texts',
      icon: BookOpen,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
      duration: '60 minutes',
    },
    WRITING: {
      title: 'Full Writing',
      subtitle: 'Official IELTS Academic format: Task 1 Report (150 words) & Task 2 Essay (250 words)',
      icon: Edit3,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      duration: '60 minutes',
    },
  }[section];

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      setError('');
      try {
        const data = await api.tests.getPublished(section);
        setTests(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load tests');
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, [section]);

  const handleStartTest = async (testId: string) => {
    setStartingId(testId);
    try {
      const res = await api.attempts.startSingle(testId);
      navigate(`/student/test/runner/${res.attempt.id}`);
    } catch (err: any) {
      alert(err.message || 'Error starting test attempt');
      setStartingId(null);
    }
  };

  const Icon = sectionMeta.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg ${sectionMeta.bgColor} ${sectionMeta.borderColor} border flex items-center justify-center ${sectionMeta.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {sectionMeta.title}
              </h1>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-300">
                {tests.length} Published Tests
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {sectionMeta.subtitle} • Standard Duration: {sectionMeta.duration}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-center space-x-2 text-red-700 text-xs rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Loading {sectionMeta.title} Library...
          </p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
          <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            No Published {sectionMeta.title} Tests
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The examiner has not published any tests for this section yet. Please check back shortly or select another module.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const hasAttempts = test.userStats?.totalAttempts > 0;
            const bestBand = test.userStats?.bestBandScore;

            return (
              <div
                key={test.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded bg-slate-100 text-slate-800 font-bold font-mono text-sm flex items-center justify-center border border-slate-200 flex-shrink-0">
                    #{test.testNumber}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {test.title}
                      </h3>
                      {test.activeVersion && (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          v{test.activeVersion.versionNumber} ({test.activeVersion.fileType})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      {test.description || 'Standard computer-delivered examination package.'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2.5 text-[11px] text-slate-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {test.timeLimitMinutes} minutes
                      </span>
                      {hasAttempts && (
                        <span className="flex items-center text-slate-600 font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Taken {test.userStats.totalAttempts} {test.userStats.totalAttempts === 1 ? 'time' : 'times'}
                        </span>
                      )}
                      {bestBand && (
                        <span className="flex items-center font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Award className="w-3 h-3 mr-1 text-blue-600" />
                          Best Band: {bestBand.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-center">
                  <button
                    onClick={() => handleStartTest(test.id)}
                    disabled={startingId === test.id}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded shadow-sm transition-colors"
                  >
                    {startingId === test.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                        Launching...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                        {hasAttempts ? 'Retake Test' : 'Start Test'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
