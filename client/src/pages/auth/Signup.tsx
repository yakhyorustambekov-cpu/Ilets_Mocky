import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const { user, signup } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup({ firstName, lastName, email, password });
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          Candidate Registration
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono uppercase tracking-wider">
          Create candidate profile for computer-delivered testing
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Jenkins"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
                  <UserPlus className="w-4 h-4 mr-1.5" /> Create Candidate Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in to candidate portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
