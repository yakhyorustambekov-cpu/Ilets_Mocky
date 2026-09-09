import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { User, KeyRound, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [targetBand, setTargetBand] = useState<string>('7.5');
  const [examDate, setExamDate] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setTargetBand(user.profile?.targetBand ? user.profile.targetBand.toString() : '7.5');
      setExamDate(user.profile?.examDate || '');
      setPhone(user.profile?.phone || '');
      setBio(user.profile?.bio || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);

    try {
      await api.profile.update({
        firstName,
        lastName,
        targetBand: parseFloat(targetBand),
        examDate,
        phone,
        bio,
      });
      await refreshUser();
      setProfileSuccess('Profile details saved successfully');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setSavingPassword(true);

    try {
      await api.profile.updatePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Candidate Identifier Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Candidate Number: <strong className="text-slate-800">{user?.candidateNumber || 'CDI-849201'}</strong> • {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Candidate Profile Details
            </h2>

            {profileSuccess && (
              <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-800 text-xs rounded flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs rounded flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Target Band Score
                  </label>
                  <select
                    value={targetBand}
                    onChange={(e) => setTargetBand(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-mono"
                  >
                    {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                      <option key={b} value={b}>
                        Band {b.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Planned Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Preparation Notes / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Aiming for university admissions in the UK..."
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div className="text-right pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security / Password */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <KeyRound className="w-4 h-4 mr-2 text-slate-700" />
              Security & Password
            </h2>

            {passwordSuccess && (
              <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 text-emerald-800 text-xs rounded">
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs rounded">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full inline-flex justify-center items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
