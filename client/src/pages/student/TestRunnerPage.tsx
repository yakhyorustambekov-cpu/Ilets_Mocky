import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, getContentUrl } from '../../api/client';
import { ExamHeader } from '../../components/ExamHeader';
import { ExamRunner } from '../../components/ExamRunner';

export const TestRunnerPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isFullMock = location.pathname.includes('/mock/runner');

  // Single test attempt state
  const [attempt, setAttempt] = useState<any>(null);

  // Full mock state
  const [mock, setMock] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<'LISTENING' | 'READING' | 'WRITING'>('LISTENING');
  const [contentUrl, setContentUrl] = useState<string>('');
  const [testTitle, setTestTitle] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<number>(60);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [capturedScores, setCapturedScores] = useState<any>(null);

  // Load single test attempt
  const loadSingleAttempt = useCallback(async (id: string) => {
    try {
      const data = await api.attempts.getById(id);
      const activeVersion = data.attempt?.testVersion || data.attempt?.test?.versions?.find((v: any) => v.isActive) || data.attempt?.test?.versions?.[0];
      setContentUrl(getContentUrl(data.attempt?.testVersionId || activeVersion?.id, activeVersion?.entryFile));
      setTestTitle(data.attempt.test?.title || `Test ${data.attempt.test?.testNumber}`);
      setTimeLimit(data.attempt.test?.timeLimitMinutes || (data.attempt.section === 'LISTENING' ? 32 : 60));
    } catch (err: any) {
      alert(err.message || 'Failed to load test attempt');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load or resume Full Mock exam
  const loadFullMock = useCallback(async () => {
    try {
      const res = await api.mocks.start();
      const activeMock = res.mock;
      setMock(activeMock);

      if (activeMock.currentSection === 'COMPLETED' || activeMock.status === 'COMPLETED') {
        navigate('/student/results');
        return;
      }

      const curSection = activeMock.currentSection as 'LISTENING' | 'READING' | 'WRITING';
      setCurrentSection(curSection);

      let version = activeMock.listeningVersion;
      let test = activeMock.listeningTest;

      if (curSection === 'READING') {
        version = activeMock.readingVersion;
        test = activeMock.readingTest;
      } else if (curSection === 'WRITING') {
        version = activeMock.writingVersion;
        test = activeMock.writingTest;
      }

      setContentUrl(getContentUrl(version?.id, version?.entryFile));
      setTestTitle(test.title);
      setTimeLimit(test.timeLimitMinutes || (curSection === 'LISTENING' ? 32 : 60));
    } catch (err: any) {
      alert(err.message || 'Failed to load full mock exam');
      navigate('/student/mock');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    if (isFullMock) {
      loadFullMock();
    } else if (attemptId) {
      loadSingleAttempt(attemptId);
    }
  }, [isFullMock, attemptId, loadFullMock, loadSingleAttempt]);

  // Handle postMessage event from the sandboxed iframe
  const handleAutoCompleted = useCallback((data: any) => {
    console.log('[TestRunnerPage] Capturing test results:', data);
    setCapturedScores(data);
  }, []);

  // Handle section submission / transition
  const handleFinishSection = async () => {
    setIsSubmitting(true);
    try {
      const scorePayload = capturedScores || {};

      if (isFullMock && mock) {
        // Advance to next section or complete full mock
        const result = await api.mocks.nextSection(mock.id, scorePayload);

        if (result.isCompleted) {
          alert('Congratulations! You have completed all 3 sections of Full IELTS Mock #' + mock.mockNumber);
          navigate('/student/results');
        } else {
          // Transition to next section
          setMock(result.mock);
          const nextSec = result.nextSection as 'LISTENING' | 'READING' | 'WRITING';
          setCurrentSection(nextSec);
          setContentUrl(result.contentUrl);

          let nextTest = result.mock.readingTest;
          if (nextSec === 'WRITING') nextTest = result.mock.writingTest;

          setTestTitle(nextTest?.title || `${nextSec} Test`);
          setTimeLimit(nextTest?.timeLimitMinutes || 60);
          setCapturedScores(null);
        }
      } else if (attempt) {
        // Complete single test
        await api.attempts.complete(attempt.id, scorePayload);
        alert('Test submitted successfully!');
        navigate('/student/results');
      }
    } catch (err: any) {
      alert(err.message || 'Error completing section');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono tracking-wider uppercase text-slate-400">
            Initializing CDI Examination Session...
          </p>
        </div>
      </div>
    );
  }

  const activeSection = isFullMock ? currentSection : (attempt?.section || 'LISTENING');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <ExamHeader
        candidateName={`${user?.firstName} ${user?.lastName}`}
        candidateNumber={user?.candidateNumber || 'CDI-849201'}
        section={activeSection}
        testTitle={testTitle}
        timeLimitMinutes={timeLimit}
        isFullMock={isFullMock}
        mockNumber={mock?.mockNumber}
        currentMockSection={isFullMock ? currentSection : undefined}
        onFinishSection={handleFinishSection}
        isSubmitting={isSubmitting}
      />

      {contentUrl ? (
        <ExamRunner
          contentUrl={contentUrl}
          onAutoCompleted={handleAutoCompleted}
        />
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs">
          Unable to locate test entry file. Please contact test administrator.
        </div>
      )}
    </div>
  );
};
