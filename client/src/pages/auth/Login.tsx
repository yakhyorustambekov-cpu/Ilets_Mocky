import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/student/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate(from.startsWith('/admin') ? '/student/dashboard' : from);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-600 text-white font-bold text-lg mb-3 shadow-md">
          CDI
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          IELTS Computer-Delivered Platform
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono uppercase tracking-wider">
          Official Candidate & Examiner Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-3 flex items-center space-x-2 text-red-700 text-xs rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@ielts.com"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/reset-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                </>
              )}
            </button>
          </form>



          <div className="mt-6 text-center text-xs text-slate-600">
            New candidate?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
              Register an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
