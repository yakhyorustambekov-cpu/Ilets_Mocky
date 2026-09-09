import React, { useState, useEffect } from 'react';
import {
  Clock,
  HelpCircle,
  Volume2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ExamHeaderProps {
  candidateName: string;
  candidateNumber: string;
  section: 'LISTENING' | 'READING' | 'WRITING';
  testTitle: string;
  timeLimitMinutes: number;
  isFullMock: boolean;
  mockNumber?: number;
  currentMockSection?: string;
  onFinishSection: () => void;
  isSubmitting?: boolean;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  candidateName,
  candidateNumber,
  section,
  testTitle,
  timeLimitMinutes,
  isFullMock,
  mockNumber,
  currentMockSection,
  onFinishSection,
  isSubmitting = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitMinutes * 60);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAudioCheckModal, setShowAudioCheckModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsRemaining < 300; // Less than 5 minutes

  const fullMockSteps = [
    { key: 'LISTENING', label: '1. Listening' },
    { key: 'READING', label: '2. Reading' },
    { key: 'WRITING', label: '3. Writing' },
  ];

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 select-none shadow-md z-30">
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* Candidate & Test Info */}
          <div className="flex items-center space-x-4">
            <div className="border-r border-slate-700 pr-4">
              <div className="text-xs text-slate-400 font-mono">CANDIDATE</div>
              <div className="text-sm font-bold tracking-tight text-slate-100">{candidateName}</div>
              <div className="text-[11px] font-mono text-slate-400">{candidateNumber}</div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                  {section}
                </span>
                {isFullMock && (
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium">
                    FULL MOCK #{mockNumber}
                  </span>
                )}
              </div>
              <div className="text-xs font-medium text-slate-300 max-w-md truncate mt-0.5">
                {testTitle}
              </div>
            </div>
          </div>

          {/* Full Mock Progress Indicator */}
          {isFullMock && (
            <div className="hidden lg:flex items-center space-x-2 bg-slate-950/70 px-3 py-1.5 rounded-md border border-slate-800">
              {fullMockSteps.map((step, idx) => {
                const isCurrent = currentMockSection === step.key;
                const isPast =
                  (currentMockSection === 'READING' && step.key === 'LISTENING') ||
                  (currentMockSection === 'WRITING' && (step.key === 'LISTENING' || step.key === 'READING')) ||
                  currentMockSection === 'COMPLETED';

                return (
                  <React.Fragment key={step.key}>
                    <div
                      className={`flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isPast
                          ? 'text-emerald-400 bg-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {isPast && <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-400" />}
                      <span>{step.label}</span>
                    </div>
                    {idx < fullMockSteps.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Controls, Timer & Submit */}
          <div className="flex items-center space-x-3">
            {/* Audio Check Button (for Listening section) */}
            {section === 'LISTENING' && (
              <button
                type="button"
                onClick={() => setShowAudioCheckModal(true)}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                title="Test sound output"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Sound Check</span>
              </button>
            )}

            {/* Help Button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Test Instructions"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Examination Clock */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded font-mono font-bold text-sm tracking-wider border ${
                isLowTime
                  ? 'bg-red-950/80 text-red-300 border-red-800 animate-pulse'
                  : 'bg-slate-950 text-slate-200 border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(secondsRemaining)} left</span>
            </div>

            {/* Submit / Proceed Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center space-x-1"
            >
              <span>
                {isFullMock
                  ? currentMockSection === 'WRITING'
                    ? 'Finish Full Mock'
                    : 'Submit & Proceed'
                  : 'Finish Section'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-amber-600 mb-4">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Submit {section} Section?
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {isFullMock ? (
                <>
                  Are you ready to submit your answers for <strong>{section}</strong>?
                  <br /><br />
                  Once submitted, you <strong>cannot return</strong> to review or modify this section.
                  {currentMockSection !== 'WRITING' && ' You will immediately proceed to the next section.'}
                </>
              ) : (
                <>
                  Are you sure you want to finish and submit this test? You will not be able to change your answers once submitted.
                </>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Return to Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  onFinishSection();
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded shadow-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sound Check Modal */}
      {showAudioCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-blue-600 mb-3">
              <Volume2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Audio System Check</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ensure your headphones or speakers are connected and adjusted to a comfortable volume. Click the audio sample below to test sound clarity:
            </p>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 flex justify-center mb-6">
              <audio controls autoPlay src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="></audio>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAudioCheckModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                Sound is Working
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Instructions Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-blue-600 mb-3">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Candidate Instructions</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 max-h-80 overflow-y-auto pr-2 mb-6">
              <p><strong>1. Examination Integrity:</strong> This test is administered under computer-delivered IELTS simulation rules. Do not close or navigate away from the test window.</p>
              <p><strong>2. Navigation:</strong> Use the question navigation or scroll through the passage and questions in the test frame.</p>
              <p><strong>3. Time Management:</strong> The timer at the top indicates remaining time. When time expires, your current answers will be automatically recorded.</p>
              <p><strong>4. Section Completion:</strong> Click <em>Submit & Proceed</em> when you have finished answering all questions in this section.</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
