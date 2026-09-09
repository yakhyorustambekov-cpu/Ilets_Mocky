import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.auth.resetPassword({ email, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono uppercase tracking-wider">
          Update your candidate or administrator access credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-slate-200">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Password Reset Successful
              </h3>
              <p className="text-xs text-slate-600 mb-6">
                Your account password has been updated. You may now sign in with your new credentials.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 flex items-center space-x-2 text-red-700 text-xs rounded">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Account Email
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
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                    <KeyRound className="w-4 h-4 mr-1.5" /> Update Password
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
