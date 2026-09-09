import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ResetPassword } from './pages/auth/ResetPassword';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TestLibrary } from './pages/student/TestLibrary';
import { FullMockIntro } from './pages/student/FullMockIntro';
import { TestRunnerPage } from './pages/student/TestRunnerPage';
import { ResultsPage } from './pages/student/ResultsPage';
import { HistoryPage } from './pages/student/HistoryPage';
import { ProfilePage } from './pages/student/ProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTests } from './pages/admin/AdminTests';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminAttempts } from './pages/admin/AdminAttempts';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminSettings } from './pages/admin/AdminSettings';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  // Hide general Navbar in exam runner mode for authentic computer-delivered IELTS exam feel
  const isExamRunner =
    location.pathname.includes('/mock/runner') ||
    location.pathname.includes('/test/runner/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && !isExamRunner && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'ADMIN' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/student/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/listening" element={<TestLibrary section="LISTENING" />} />
            <Route path="/student/reading" element={<TestLibrary section="READING" />} />
            <Route path="/student/writing" element={<TestLibrary section="WRITING" />} />
            <Route path="/student/mock" element={<FullMockIntro />} />
            <Route path="/student/mock/runner" element={<TestRunnerPage />} />
            <Route path="/student/test/runner/:attemptId" element={<TestRunnerPage />} />
            <Route path="/student/results" element={<ResultsPage />} />
            <Route path="/student/history" element={<HistoryPage />} />
            <Route path="/student/profile" element={<ProfilePage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/attempts" element={<AdminAttempts />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};
