import React, { useState, useEffect, useRef } from 'react';

interface ExamRunnerProps {
  contentUrl: string;
  onAutoCompleted?: (resultData: {
    rawScore?: number;
    maxScore?: number;
    bandScore?: number;
    resultData?: any;
  }) => void;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  contentUrl,
  onAutoCompleted,
}) => {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);

    const handleMessage = (event: MessageEvent) => {
      // Secure postMessage handler for test completion detection
      if (event.data && typeof event.data === 'object') {
        if (
          event.data.type === 'IELTS_TEST_COMPLETE' ||
          event.data.type === 'TEST_COMPLETED' ||
          event.data.action === 'complete'
        ) {
          console.log('[ExamRunner] Received test completion postMessage:', event.data);
          if (onAutoCompleted) {
            onAutoCompleted({
              rawScore: event.data.rawScore,
              maxScore: event.data.maxScore,
              bandScore: event.data.bandScore,
              resultData: event.data.resultData || event.data,
            });
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [contentUrl, onAutoCompleted]);

  return (
    <div className="relative w-full h-[calc(100vh-53px)] bg-slate-100 overflow-hidden flex flex-col">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
              Loading Examination Environment...
            </p>
          </div>
        </div>
      )}

      {/*
        Sandboxed iframe:
        - allow-scripts: runs the test logic/interactivity
        - allow-forms: allows form submissions/inputs
        - allow-modals: allows alerts/dialogs
        - allow-downloads: allows download if needed
        - NO allow-same-origin: isolates origin to 'null', preventing access to parent localStorage, cookies, tokens, or DOM!
      */}
      <iframe
        ref={iframeRef}
        src={contentUrl}
        title="IELTS Test Examination"
        className="w-full h-full border-0 flex-1"
        sandbox="allow-scripts allow-forms allow-modals allow-downloads"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};
