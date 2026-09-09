import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Layers,
  Headphones,
  BookOpen,
  Edit3,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const FullMockIntro: React.FC = () => {
  const navigate = useNavigate();
  const [activeMock, setActiveMock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkCurrentMock() {
      try {
        const data = await api.mocks.getCurrent();
        setActiveMock(data.activeMock);
      } catch (err: any) {
        console.error('Error checking active mock:', err);
      } finally {
        setLoading(false);
      }
    }
    checkCurrentMock();
  }, []);

  const handleStartOrResume = async () => {
    setError('');
    setStarting(true);
    try {
      // POST /api/mocks/start returns either existing in-progress mock or generates a new randomized assignment
      await api.mocks.start();
      navigate('/student/mock/runner');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize full mock exam');
      setStarting(false);
    }
  };

  const handleAbandon = async () => {
    if (!activeMock) return;
    const confirm = window.confirm(
      'Are you sure you want to abandon this Full Mock attempt? The current attempt will be marked ABANDONED and a new test combination can be generated next time.'
    );
    if (!confirm) return;

    try {
      await api.mocks.abandon(activeMock.id);
      setActiveMock(null);
    } catch (err: any) {
      alert(err.message || 'Failed to abandon mock');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm mb-8 text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-lg text-white flex items-center justify-center mx-auto mb-4 shadow">
          <Layers className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Full IELTS Academic Mock Examination
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mt-1">
          Complete 3-Module Computer-Delivered Simulation
        </p>

        <p className="text-sm text-slate-600 max-w-xl mx-auto mt-4 leading-relaxed">
          Simulates the real test conditions under timed sequential delivery. The examination consists of Listening, followed immediately by Reading, and concluding with Writing.
        </p>

        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-3 flex items-center space-x-2 text-red-700 text-xs rounded text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {activeMock ? (
            <>
              <button
                type="button"
                onClick={handleStartOrResume}
                disabled={starting}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded shadow flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Resume Full Mock #{activeMock.mockNumber} (At {activeMock.currentSection})</span>
              </button>

              <button
                type="button"
                onClick={handleAbandon}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1 inline" />
                Abandon & Reset
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartOrResume}
              disabled={starting || loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded shadow flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {starting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Selecting Randomized Tests...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Full IELTS Mock</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3 Steps Pipeline Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Step 1: Listening */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-600 mb-2 font-bold text-xs">
            <Headphones className="w-4 h-4" />
            <span>SECTION 1: LISTENING</span>
          </div>
          <div className="text-sm font-bold text-slate-800 mb-1">
            40 Questions / 4 Parts
          </div>
          <div className="text-xs text-slate-500 mb-3 leading-relaxed">
            Audio recording plays once. Form completion, diagrams, and matching.
          </div>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
            Duration: 30-32 minutes
          </div>
        </div>

        {/* Step 2: Reading */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-sky-600 mb-2 font-bold text-xs">
            <BookOpen className="w-4 h-4" />
            <span>SECTION 2: READING</span>
          </div>
          <div className="text-sm font-bold text-slate-800 mb-1">
            40 Questions / 3 Passages
          </div>
          <div className="text-xs text-slate-500 mb-3 leading-relaxed">
            Split-screen texts. Multiple choice, True/False/Not Given, and headings.
          </div>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
            Duration: 60 minutes
          </div>
        </div>

        {/* Step 3: Writing */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-600 mb-2 font-bold text-xs">
            <Edit3 className="w-4 h-4" />
            <span>SECTION 3: WRITING</span>
          </div>
          <div className="text-sm font-bold text-slate-800 mb-1">
            Task 1 & Task 2 Essays
          </div>
          <div className="text-xs text-slate-500 mb-3 leading-relaxed">
            150 words report + 250 words essay with live word counters.
          </div>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
            Duration: 60 minutes
          </div>
        </div>
      </div>

      {/* Examination Protocol Guidelines */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-xs text-slate-600 space-y-2.5">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center">
          <ShieldCheck className="w-4 h-4 text-slate-700 mr-1.5" />
          Server-Side Test Randomization & Anti-Repeat System
        </h3>
        <p>
          • <strong>Independent Random Selection:</strong> Tests are selected randomly on the server. The admin does not manually construct combinations.
        </p>
        <p>
          • <strong>Zero Repeats:</strong> You will not receive the same test in any section until all available published tests in that section have been completed.
        </p>
        <p>
          • <strong>Persistent Assignment:</strong> Once generated, your Full Mock combination is saved to your account. If you refresh, disconnect, or leave the browser, your exact assignment and current progress are preserved.
        </p>
      </div>
    </div>
  );
};
